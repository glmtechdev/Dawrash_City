'use client'

import { useState } from 'react'
import { AdminShell, type AdminSection } from '@/components/dawrash/admin-shell'
import {
  OverviewSection,
  MembersSection,
  CertificatesSection,
  AuditSection,
} from '@/components/dawrash/admin-sections'
import type { AdminMember } from '@/app/admin/actions'

export function AdminClient({ members }: { members: AdminMember[] }) {
  const [section, setSection] = useState<AdminSection>('overview')

  return (
    <AdminShell section={section} onSection={setSection}>
      {section === 'overview'      ? <OverviewSection members={members} />      : null}
      {section === 'members'       ? <MembersSection members={members} />       : null}
      {section === 'audit'         ? <AuditSection />                           : null}
      {section === 'certificates'  ? <CertificatesSection members={members} />  : null}
    </AdminShell>
  )
}
