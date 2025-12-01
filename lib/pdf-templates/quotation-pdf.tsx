import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyInfo: {
    marginLeft: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#FFC92B',
  },
  companyDetails: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  quotationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  quotationNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statusBadge: {
    padding: 5,
    backgroundColor: '#FFF3CC',
    color: '#8F6E00',
    fontSize: 10,
    borderRadius: 3,
    alignSelf: 'flex-start',
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
  billToSection: {
    marginBottom: 20,
  },
  billToHeader: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 12,
    color: '#333',
  },
  billToText: {
    marginBottom: 3,
    color: '#666',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFC92B',
    padding: 8,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #ddd',
  },
  tableColNum: {
    width: '8%',
  },
  tableColDesc: {
    width: '42%',
  },
  tableColQty: {
    width: '12%',
    textAlign: 'right',
  },
  tableColUnit: {
    width: '12%',
    textAlign: 'center',
  },
  tableColPrice: {
    width: '13%',
    textAlign: 'right',
  },
  tableColTotal: {
    width: '13%',
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
    borderTop: '2 solid #FFC92B',
    backgroundColor: '#FFF9E5',
    padding: 10,
  },
  grandTotalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  grandTotalValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC92B',
  },
  notesSection: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderLeft: '3 solid #FFC92B',
  },
  notesHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  notesText: {
    color: '#666',
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
  validUntil: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#FFF3CC',
    borderRadius: 3,
    textAlign: 'center',
    fontSize: 10,
  },
})

interface QuotationItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

interface QuotationData {
  id: string
  quotationNumber?: string
  createdAt: string
  validUntil?: string | null
  client?: {
    name: string
    phone: string
    email?: string | null
  } | null
  lead?: {
    name: string
    phone: string
  } | null
  site?: {
    name: string
    address?: string | null
  } | null
  items: QuotationItem[]
  total: number
  notes?: string | null
  status: string
}

export const QuotationPDF = ({ quotation }: { quotation: QuotationData }) => {
  const clientName = quotation.client?.name || quotation.lead?.name || 'N/A'
  const clientPhone = quotation.client?.phone || quotation.lead?.phone || 'N/A'
  const clientEmail = quotation.client?.email

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image
              src="/logo.png"
              style={styles.logo}
            />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>Golden Services</Text>
              <Text style={styles.companyDetails}>Professional Cleaning & Pest Control</Text>
              <Text style={styles.companyDetails}>Muscat, Sultanate of Oman</Text>
              <Text style={styles.companyDetails}>Phone: +968 1234 5678</Text>
              <Text style={styles.companyDetails}>Email: info@goldenservices.om</Text>
            </View>
          </View>
          <View>
            <Text style={styles.quotationTitle}>QUOTATION</Text>
            <Text style={styles.quotationNumber}>#{quotation.quotationNumber || quotation.id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.statusBadge}>{quotation.status}</Text>
          </View>
        </View>

        {/* Quotation Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {format(new Date(quotation.createdAt), 'PP')}
            </Text>
          </View>
          {quotation.validUntil && (
            <View style={styles.row}>
              <Text style={styles.label}>Valid Until:</Text>
              <Text style={styles.value}>
                {format(new Date(quotation.validUntil), 'PP')}
              </Text>
            </View>
          )}
        </View>

        {/* Client/Lead Details */}
        <View style={styles.billToSection}>
          <Text style={styles.billToHeader}>
            {quotation.client ? 'Bill To:' : 'Quote For:'}
          </Text>
          <Text style={styles.billToText}>{clientName}</Text>
          <Text style={styles.billToText}>Phone: {clientPhone}</Text>
          {clientEmail && (
            <Text style={styles.billToText}>Email: {clientEmail}</Text>
          )}
          {quotation.site && (
            <View style={{ marginTop: 5 }}>
              <Text style={styles.billToText}>Site: {quotation.site.name}</Text>
              {quotation.site.address && (
                <Text style={styles.billToText}>Address: {quotation.site.address}</Text>
              )}
            </View>
          )}
        </View>

        {/* Valid Until Banner */}
        {quotation.validUntil && (
          <View style={styles.validUntil}>
            <Text>This quotation is valid until {format(new Date(quotation.validUntil), 'PP')}</Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableColNum}>#</Text>
            <Text style={styles.tableColDesc}>Description</Text>
            <Text style={styles.tableColQty}>Qty</Text>
            <Text style={styles.tableColUnit}>Unit</Text>
            <Text style={styles.tableColPrice}>Unit Price</Text>
            <Text style={styles.tableColTotal}>Total</Text>
          </View>
          {quotation.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableColNum}>{index + 1}</Text>
              <Text style={styles.tableColDesc}>{item.description}</Text>
              <Text style={styles.tableColQty}>{item.quantity}</Text>
              <Text style={styles.tableColUnit}>{item.unit}</Text>
              <Text style={styles.tableColPrice}>
                {item.unitPrice.toFixed(3)} OMR
              </Text>
              <Text style={styles.tableColTotal}>{item.total.toFixed(3)} OMR</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalsSection}>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Grand Total:</Text>
            <Text style={styles.grandTotalValue}>
              {quotation.total.toFixed(3)} OMR
            </Text>
          </View>
        </View>

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesHeader}>Notes:</Text>
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for considering our services!</Text>
          <Text>For any queries, please contact us at info@goldenservices.om</Text>
        </View>
      </Page>
    </Document>
  )
}
