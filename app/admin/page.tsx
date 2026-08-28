'use client'

import { useState } from 'react'
import { AdminShell, type AdminSection } from '@/components/dawrash/admin-shell'
import {
  OverviewSection,
  MembersSection,
  CertificatesSection,
  AuditSection,
} from '@/components/dawrash/admin-sections'

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>('overview')

  return (
    <AdminShell section={section} onSection={setSection}>
      {section === 'overview' ? <OverviewSection /> : null}
      {section === 'members' ? <MembersSection /> : null}
      {section === 'audit' ? <AuditSection /> : null}
      {section === 'certificates' ? <CertificatesSection /> : null}
    </AdminShell>
  )
}
