import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { LOGO_BASE64 } from '@/lib/logo-base64'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#FFFFFF',
  },
  headerBanner: {
    backgroundColor: '#FFC92B',
    marginLeft: -40,
    marginRight: -40,
    marginTop: -40,
    marginBottom: 25,
    padding: 20,
    paddingLeft: 40,
    paddingRight: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    padding: 5,
  },
  companyInfo: {
    marginLeft: 5,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  companyTagline: {
    fontSize: 10,
    color: '#333',
    fontStyle: 'italic',
  },
  companyDetails: {
    fontSize: 8,
    color: '#333',
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    textAlign: 'right',
  },
  statusBadge: {
    padding: 6,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: '#1a1a1a',
    color: '#FFC92B',
    fontSize: 10,
    fontWeight: 'bold',
    borderRadius: 3,
    alignSelf: 'flex-end',
  },
  section: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFF9E5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    borderLeft: '4 solid #FFC92B',
  },
  billToSection: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    borderLeft: '4 solid #FFC92B',
  },
  billToHeader: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 11,
    color: '#1a1a1a',
    textTransform: 'uppercase',
  },
  billToText: {
    marginBottom: 4,
    color: '#333',
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#1a1a1a',
    fontSize: 10,
  },
  value: {
    flex: 1,
    color: '#333',
    fontSize: 10,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 10,
    fontWeight: 'bold',
    color: '#FFC92B',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1 solid #e0e0e0',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1 solid #e0e0e0',
    backgroundColor: '#FAFAFA',
  },
  tableColDesc: {
    width: '50%',
  },
  tableColQty: {
    width: '15%',
    textAlign: 'right',
  },
  tableColPrice: {
    width: '15%',
    textAlign: 'right',
  },
  tableColTotal: {
    width: '20%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 25,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 280,
    marginBottom: 8,
    paddingBottom: 8,
  },
  totalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontSize: 10,
    color: '#333',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
    color: '#333',
  },
  grandTotal: {
    flexDirection: 'row',
    width: 280,
    marginTop: 5,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
    borderTop: '3 solid #FFC92B',
    borderBottom: '3 solid #FFC92B',
    backgroundColor: '#1a1a1a',
  },
  grandTotalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC92B',
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC92B',
  },
  notesSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#FFF9E5',
    borderLeft: '4 solid #FFC92B',
    borderRadius: 5,
  },
  notesHeader: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  notesText: {
    color: '#333',
    fontSize: 10,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 9,
    borderTop: '2 solid #FFC92B',
    paddingTop: 15,
  },
  footerText: {
    marginBottom: 3,
    color: '#333',
  },
})

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  client: {
    name: string
    phone: string
    email?: string | null
  }
  jobOrder?: {
    jobNumber: string
    scheduledDate: string
  } | null
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string | null
  status: string
}

export const InvoicePDF = ({ invoice }: { invoice: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image
              src={LOGO_BASE64}
              style={styles.logo}
            />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>Golden Services</Text>
              <Text style={styles.companyTagline}>Professional Cleaning & Pest Control</Text>
              <Text style={styles.companyDetails}>Muscat, Sultanate of Oman | +968 1234 5678 | info@goldenservices.om</Text>
            </View>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <Text style={styles.statusBadge}>{invoice.status}</Text>
          </View>
        </View>
      </View>

      {/* Invoice Details */}
      <View style={styles.infoCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Invoice Date:</Text>
          <Text style={styles.value}>
            {format(new Date(invoice.invoiceDate), 'PP')}
          </Text>
        </View>
        {invoice.dueDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>
              {format(new Date(invoice.dueDate), 'PP')}
            </Text>
          </View>
        )}
        {invoice.jobOrder && (
          <View style={styles.row}>
            <Text style={styles.label}>Job Number:</Text>
            <Text style={styles.value}>{invoice.jobOrder.jobNumber}</Text>
          </View>
        )}
      </View>

      {/* Client Details */}
      <View style={styles.billToSection}>
        <Text style={styles.billToHeader}>Bill To:</Text>
        <Text style={styles.billToText}>{invoice.client.name}</Text>
        <Text style={styles.billToText}>Phone: {invoice.client.phone}</Text>
        {invoice.client.email && (
          <Text style={styles.billToText}>Email: {invoice.client.email}</Text>
        )}
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableColDesc}>Description</Text>
          <Text style={styles.tableColQty}>Quantity</Text>
          <Text style={styles.tableColPrice}>Unit Price</Text>
          <Text style={styles.tableColTotal}>Total</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.tableColDesc}>{item.description}</Text>
            <Text style={styles.tableColQty}>{item.quantity}</Text>
            <Text style={styles.tableColPrice}>
              {item.unitPrice.toFixed(3)} OMR
            </Text>
            <Text style={styles.tableColTotal}>{item.total.toFixed(3)} OMR</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{invoice.subtotal.toFixed(3)} OMR</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax:</Text>
          <Text style={styles.totalValue}>{invoice.tax.toFixed(3)} OMR</Text>
        </View>
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>Total:</Text>
          <Text style={styles.grandTotalValue}>
            {invoice.total.toFixed(3)} OMR
          </Text>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesHeader}>Notes:</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for your business!</Text>
        <Text style={styles.footerText}>Golden Services - Professional Cleaning & Pest Control</Text>
        <Text style={{ marginTop: 5, color: '#666' }}>For any queries, please contact us at info@goldenservices.om or call +968 1234 5678</Text>
      </View>
    </Page>
  </Document>
)
