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
  quotationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
    textAlign: 'right',
  },
  quotationNumber: {
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
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    color: '#1a1a1a',
    fontSize: 10,
  },
  value: {
    flex: 1,
    color: '#333',
    fontSize: 10,
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
  validUntil: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#FFC92B',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
              <Text style={styles.quotationTitle}>QUOTATION</Text>
              <Text style={styles.quotationNumber}>#{quotation.quotationNumber || quotation.id.substring(0, 8).toUpperCase()}</Text>
              <Text style={styles.statusBadge}>{quotation.status}</Text>
            </View>
          </View>
        </View>

        {/* Valid Until Banner */}
        {quotation.validUntil && (
          <View style={styles.validUntil}>
            <Text>⏰ This quotation is valid until {format(new Date(quotation.validUntil), 'PP')}</Text>
          </View>
        )}

        {/* Quotation Details */}
        <View style={styles.infoCard}>
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
            <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
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
          <Text style={styles.footerText}>Thank you for considering our services!</Text>
          <Text style={styles.footerText}>Golden Services - Professional Cleaning & Pest Control</Text>
          <Text style={{ marginTop: 5, color: '#666' }}>For any queries, please contact us at info@goldenservices.om or call +968 1234 5678</Text>
        </View>
      </Page>
    </Document>
  )
}
