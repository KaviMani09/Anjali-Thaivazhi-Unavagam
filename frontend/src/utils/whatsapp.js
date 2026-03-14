const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '9585833661'
const BOOKING_WA_NUMBER = import.meta.env.VITE_BOOKING_WHATSAPP_NUMBER || '9585833661'

function openWA(message, toNumber = WA_NUMBER, options = {}) {
  const { mode = 'new_tab' } = options || {}
  const encoded = encodeURIComponent(message.trim())
  const number = String(toNumber || '').replace(/[^\d]/g, '') || WA_NUMBER
  const url = `https://wa.me/${number}?text=${encoded}`
  if (mode === 'same_tab') {
    window.location.assign(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export const sendOrderToWhatsApp = (orderDetails, cartItems, total) => {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const paymentStatus = orderDetails?.paymentMethod || 'Pending'

  const itemsList = cartItems
    .map((item) => `• ${item.name} × ${item.qty} = ₹${Number(item.price) * item.qty}`)
    .join('\n')

  const message = `
🍽️ *New Order - Anjali Thaivazhi Unavagam*
━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${dateStr}
🕐 Time: ${timeStr}
👤 Customer: ${orderDetails.name}
📞 Phone: ${orderDetails.phone}
🪑 Table/Type: ${orderDetails.tableOrDelivery}
━━━━━━━━━━━━━━━━━━━━━
📋 *Order Items:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━━
💰 *Total: ₹${total}*
📦 Order Status: Pending
💳 Payment Status: ${paymentStatus}
  `

  // If a valid customer phone is provided, send the bill to that WhatsApp number.
  // Otherwise fall back to the restaurant's default WhatsApp number.
  const customerNumber =
    orderDetails?.phone && orderDetails.phone !== 'NA'
      ? orderDetails.phone
      : WA_NUMBER

  openWA(message, customerNumber)
}

export const sendCateringToWhatsApp = (cateringDetails) => {
  const message = `
🎉 *Catering/Event Booking Request*
━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${cateringDetails.name}
📞 Phone: ${cateringDetails.phone}
📅 Event Date: ${cateringDetails.eventDate}
🎊 Event Type: ${cateringDetails.eventType}
📍 Venue: ${cateringDetails.venue}
👥 Guests: ${cateringDetails.guests}
🍛 Menu: ${cateringDetails.menuPreference}
💰 Budget: ₹${cateringDetails.budget}
📝 Notes: ${cateringDetails.message || '-'}
  `

  openWA(message)
}

export const sendBookingToWhatsApp = (bookingDetails) => {
  const message = `
🪑📅 *Table Booking Request*
━━━━━━━━━━━━━━━━━━━━━
🙋‍♂️ Name: ${bookingDetails.name}
📞 Phone: ${bookingDetails.phone}
📧 Email: ${bookingDetails.email || '-'}
📅 Date: ${bookingDetails.date}
⏰ Time: ${bookingDetails.time}
👥 Guests: ${bookingDetails.guests}
📝 Special requests: ${bookingDetails.specialRequests || '-'}
  `
  // Booking: redirect to WhatsApp immediately for quickest sending
  openWA(message, BOOKING_WA_NUMBER, { mode: 'same_tab' })
}

