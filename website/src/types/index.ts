export interface NavItem {
  label: string;
  href: string;
}

export interface Service {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: string; // emoji or letter
}

export interface WorkItem {
  id: string;
  outcome: string;       // the headline — leads with result
  context: string;       // what/who it was built for
  description: string;   // what was built
  tags: string[];
  imageDesktop?: string;
  imageMobile?: string;
  liveUrl?: string;
  flip?: boolean;        // alternate image/text sides
}

export interface ContactInfo {
  label: string;
  value: string;
  href?: string;
}
