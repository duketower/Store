import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  collection,
  deleteField,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

function parseEnv(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const equalsIndex = line.indexOf('=')
      if (equalsIndex === -1) return acc

      const key = line.slice(0, equalsIndex).trim()
      const value = line.slice(equalsIndex + 1).trim()
      acc[key] = value
      return acc
    }, {})
}

async function loadFirebaseConfig() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const envPath = path.resolve(scriptDir, '../.env')
  const env = parseEnv(await fs.readFile(envPath, 'utf8'))

  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
}

async function main() {
  const firebaseConfig = await loadFirebaseConfig()
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  await signInAnonymously(auth)

  const firestore = getFirestore(app)
  const employeesSnapshot = await getDocs(collection(firestore, 'employees'))

  if (employeesSnapshot.empty) {
    console.log('No employee docs found.')
    return
  }

  let touched = 0

  for (let index = 0; index < employeesSnapshot.docs.length; index += 200) {
    const batch = writeBatch(firestore)

    for (const employeeDoc of employeesSnapshot.docs.slice(index, index + 200)) {
      const data = employeeDoc.data()
      const numericId = Number(employeeDoc.id)
      const hasPinHash = typeof data.pinHash === 'string' && data.pinHash.length > 0
      const credentialUpdatedAt = data.credentialUpdatedAt ?? data.updatedAt ?? data.createdAt ?? serverTimestamp()

      if (hasPinHash && Number.isFinite(numericId)) {
        batch.set(
          doc(firestore, 'employee_credentials', employeeDoc.id),
          {
            employeeId: numericId,
            pinHash: data.pinHash,
            updatedAt: credentialUpdatedAt,
          },
          { merge: true }
        )
      }

      batch.set(
        doc(firestore, 'employees', employeeDoc.id),
        {
          credentialUpdatedAt,
          pinHash: deleteField(),
          passwordHash: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      if (hasPinHash) touched += 1
    }

    await batch.commit()
  }

  const verificationSnapshot = await getDocs(collection(firestore, 'employees'))
  const leakedDocs = verificationSnapshot.docs.filter((employeeDoc) => typeof employeeDoc.data().pinHash === 'string')
  if (leakedDocs.length > 0) {
    throw new Error(`pinHash still present on ${leakedDocs.length} employee docs`)
  }

  console.log(`Migrated employee credential storage for ${touched} employee docs.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
