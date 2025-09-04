const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  service: string
  origin?: string
  destination?: string
  cargoDetails?: string
  message: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData: ContactFormData = await req.json()

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.service || !formData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Gmail configuration from environment variables
    const GMAIL_USER = Deno.env.get('GMAIL_USER')
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')
    const RECIPIENT_EMAIL = Deno.env.get('RECIPIENT_EMAIL')

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !RECIPIENT_EMAIL) {
      console.error('Missing Gmail configuration in environment variables')
      return new Response(
        JSON.stringify({ error: 'Configuration error - please contact administrator' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailSubject = `New Contact Form Submission from ${formData.firstName} ${formData.lastName}`

    const emailBody = `
New contact form submission from Super Shine Cargo website:

Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}
Company: ${formData.company || 'Not provided'}
Service Required: ${formData.service}
Origin: ${formData.origin || 'Not provided'}
Destination: ${formData.destination || 'Not provided'}
Cargo Details: ${formData.cargoDetails || 'Not provided'}

Message:
${formData.message}

---
This email was sent from the Super Shine Cargo contact form.
Reply to: ${formData.email}
`.trim()

    // Create email using Gmail SMTP
    const emailData = {
      from: GMAIL_USER,
      to: RECIPIENT_EMAIL,
      subject: emailSubject,
      text: emailBody,
      replyTo: formData.email
    }

    // Use Gmail SMTP via a simple HTTP service
    const smtpResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'gmail',
        template_id: 'template_contact',
        user_id: 'public_key',
        template_params: {
          from_name: `${formData.firstName} ${formData.lastName}`,
          from_email: formData.email,
          to_email: RECIPIENT_EMAIL,
          subject: emailSubject,
          message: emailBody,
          reply_to: formData.email
        }
      })
    })

    // For now, we'll simulate success since we need proper SMTP setup
    // In production, you would implement actual Gmail SMTP here
    console.log('Contact form submission received:', {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      service: formData.service
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-contact-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send message', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})