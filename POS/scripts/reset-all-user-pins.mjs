import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import bcrypt from 'bcryptjs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  collection,
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
  const nextPin = process.argv[2] ?? '1234'

  if (!/^\d{4}$/.test(nextPin)) {
    throw new Error('PIN must be exactly 4 digits')
  }

  const firebaseConfig = await loadFirebaseConfig()
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  await signInAnonymously(auth)

  const firestore = getFirestore(app)
  const employeesSnapshot = await getDocs(collection(firestore, 'employees'))
  if (employeesSnapshot.empty) {
    console.log('No employees found in Firestore.')
    return
  }

  const pinHash = await bcrypt.hash(nextPin, 10)
  const employees = employeesSnapshot.docs.map((employeeDoc) => ({
    id: employeeDoc.id,
    name: String(employeeDoc.data().name ?? employeeDoc.id),
  }))

  for (let index = 0; index < employees.length; index += 450) {
    const batch = writeBatch(firestore)
    for (const employee of employees.slice(index, index + 450)) {
      batch.set(
        doc(firestore, 'employees', employee.id),
        {
          pinHash,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    }
    await batch.commit()
  }

  const verificationSnapshot = await getDocs(collection(firestore, 'employees'))
  const verification = await Promise.all(
    verificationSnapshot.docs.map(async (employeeDoc) => ({
      id: employeeDoc.id,
      name: String(employeeDoc.data().name ?? employeeDoc.id),
      valid: typeof employeeDoc.data().pinHash === 'string'
        ? await bcrypt.compare(nextPin, employeeDoc.data().pinHash)
        : false,
    }))
  )

  const failed = verification.filter((employee) => !employee.valid)
  if (failed.length > 0) {
    throw new Error(
      `PIN reset failed for: ${failed.map((employee) => `${employee.name} (${employee.id})`).join(', ')}`
    )
  }

  console.log(`Reset PIN to ${nextPin} for ${verification.length} employees:`)
  for (const employee of verification) {
    console.log(`- ${employee.name} (${employee.id})`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
