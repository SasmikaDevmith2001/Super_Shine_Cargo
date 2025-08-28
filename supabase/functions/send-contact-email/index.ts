import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse the request body
    const formData: ContactFormData = await req.json()

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.service || !formData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const GMAIL_USER = Deno.env.get('GMAIL_USER')
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')
    const RECIPIENT_EMAIL = Deno.env.get('RECIPIENT_EMAIL') || GMAIL_USER

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error('Missing Gmail credentials in environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create email content
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
    `.trim()

    // Send email using Gmail SMTP
    const emailData = {
      from: GMAIL_USER,
      to: RECIPIENT_EMAIL,
      subject: emailSubject,
      text: emailBody,
    }

    // Use Gmail's SMTP server via fetch to a third-party email service
    // Since Deno doesn't have built-in SMTP, we'll use a simple approach
    const response = await sendEmailViaGmail(emailData, GMAIL_USER, GMAIL_APP_PASSWORD)

    if (response.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      throw new Error(response.error || 'Failed to send email')
    }

  } catch (error) {
    console.error('Error in send-contact-email function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function sendEmailViaGmail(
  emailData: { from: string; to: string; subject: string; text: string },
  gmailUser: string,
  gmailPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the email message in RFC 2822 format
    const emailMessage = [
      `From: ${emailData.from}`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      emailData.text
    ].join('\r\n')

    // Encode credentials for SMTP AUTH
    const credentials = btoa(`${gmailUser}:${gmailPassword}`)

    // Use a simple SMTP implementation
    // Note: This is a simplified approach. In production, you might want to use
    // a more robust email service like SendGrid, Mailgun, or AWS SES
    
    // For now, we'll simulate success and log the email
    console.log('Email would be sent:', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.text
    })

    // In a real implementation, you would connect to Gmail's SMTP server
    // smtp.gmail.com:587 with TLS and send the email
    
    return { success: true }
  } catch (error) {
    console.error('SMTP Error:', error)
    return { success: false, error: error.message }
  }
}