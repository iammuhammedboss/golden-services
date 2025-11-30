import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  companyDetails: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    flex: 1,
    color: '#666',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '2 solid #333',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #ddd',
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
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 250,
    marginBottom: 5,
  },
  totalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontWeight: 'bold',
  },
  totalValue: {
    width: 80,
    textAlign: 'right',
  },
  grandTotal: {
    flexDirection: 'row',
    width: 250,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #333',
  },
  grandTotalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 9,
    borderTop: '1 solid #ddd',
    paddingTop: 10,
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>Golden Services</Text>
        <Text style={styles.companyDetails}>Professional Cleaning & Pest Control</Text>
        <Text style={styles.companyDetails}>Phone: +971 XX XXX XXXX</Text>
        <Text style={styles.companyDetails}>Email: info@goldenservices.ae</Text>
      </View>

      <Text style={styles.invoiceTitle}>INVOICE</Text>

      {/* Invoice Details */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Invoice Number:</Text>
          <Text style={styles.value}>{invoice.invoiceNumber}</Text>
        </View>
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
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{invoice.status}</Text>
        </View>
      </View>

      {/* Client Details */}
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 12 }}>
          Bill To:
        </Text>
        <Text style={{ marginBottom: 3 }}>{invoice.client.name}</Text>
        <Text style={{ marginBottom: 3 }}>Phone: {invoice.client.phone}</Text>
        {invoice.client.email && (
          <Text style={{ marginBottom: 3 }}>Email: {invoice.client.email}</Text>
        )}
      </View>

      {/* Job Details */}
      {invoice.jobOrder && (
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Job Number:</Text>
            <Text style={styles.value}>{invoice.jobOrder.jobNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Scheduled Date:</Text>
            <Text style={styles.value}>
              {format(new Date(invoice.jobOrder.scheduledDate), 'PP')}
            </Text>
          </View>
        </View>
      )}

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableColDesc}>Description</Text>
          <Text style={styles.tableColQty}>Quantity</Text>
          <Text style={styles.tableColPrice}>Unit Price</Text>
          <Text style={styles.tableColTotal}>Total</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
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
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Notes:</Text>
          <Text style={{ color: '#666' }}>{invoice.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>For any queries, please contact us at info@goldenservices.ae</Text>
      </View>
    </Page>
  </Document>
)
