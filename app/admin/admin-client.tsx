'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminShell, type AdminSection } from '@/components/dawrash/admin-shell'
import {
  OverviewSection,
  MembersSection,
  TransactionsSection,
  ApplicationsSection,
  CertificatesSection,
  AuditSection,
  RecordPaymentModal,
} from '@/components/dawrash/admin-sections'
import type { AdminDashboardData } from '@/app/admin/actions'

export function AdminClient({ initialData }: { initialData: AdminDashboardData }) {
  const router = useRouter()
  const [section, setSection] = useState<AdminSection>('overview')
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [recordPaymentMemberId, setRecordPaymentMemberId] = useState<string | undefined>()

  const pendingTxCount = initialData.transactions.filter((t) => t.status === 'pending').length
  const pendingApplicationsCount = initialData.applications.filter((a) => a.status === 'pending').length
  const completedWithoutCertCount = initialData.members.filter(
    (m) =>
      (m.status === 'completed' ||
        m.transactions.filter((t) => t.status === 'confirmed').reduce((s, t) => s + t.amountKobo, 0) >=
          m.plots * 2_000_000 * 100) &&
      !initialData.certificates.some((c) => c.memberId === m.id && c.issuedAt),
  ).length
  const unresolvedFlagsCount = initialData.auditFlags.filter((f) => !f.resolved).length

  function handleRefresh() {
    router.refresh()
  }

  function handleOpenRecordPayment(memberId?: string) {
    setRecordPaymentMemberId(memberId)
    setRecordPaymentOpen(true)
  }

  return (
    <>
      <AdminShell
        section={section}
        onSection={setSection}
        counts={{
          pendingTransactions: pendingTxCount,
          pendingApplications: pendingApplicationsCount,
          pendingCertificates: completedWithoutCertCount,
          unresolvedFlags: unresolvedFlagsCount,
        }}
      >
        {section === 'overview' && (
          <OverviewSection
            members={initialData.members}
            transactions={initialData.transactions}
            auditFlags={initialData.auditFlags}
            certificates={initialData.certificates}
            applications={initialData.applications}
            onNavigate={setSection}
            onOpenRecordPayment={handleOpenRecordPayment}
          />
        )}

        {section === 'members' && (
          <MembersSection
            members={initialData.members}
            onRefresh={handleRefresh}
            onOpenRecordPayment={handleOpenRecordPayment}
          />
        )}

        {section === 'transactions' && (
          <TransactionsSection
            transactions={initialData.transactions}
            members={initialData.members}
            onRefresh={handleRefresh}
            onOpenRecordPayment={handleOpenRecordPayment}
          />
        )}

        {section === 'applications' && (
          <ApplicationsSection
            applications={initialData.applications}
            onRefresh={handleRefresh}
          />
        )}

        {section === 'certificates' && (
          <CertificatesSection
            members={initialData.members}
            certificates={initialData.certificates}
            onRefresh={handleRefresh}
          />
        )}

        {section === 'audit' && (
          <AuditSection
            auditFlags={initialData.auditFlags}
            onRefresh={handleRefresh}
          />
        )}
      </AdminShell>

      <RecordPaymentModal
        open={recordPaymentOpen}
        defaultMemberId={recordPaymentMemberId}
        members={initialData.members}
        onClose={() => setRecordPaymentOpen(false)}
        onSuccess={handleRefresh}
      />
    </>
  )
}
