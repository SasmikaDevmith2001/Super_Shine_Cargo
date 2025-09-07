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

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('Missing Resend API key in environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailSubject = New Contact Form Submission from ${formData.firstName} ${formData.lastName}
    
    // Create HTML version for better formatting
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #2c3e50;">New Contact Form Submission</h2>
      <p><strong>From:</strong> Super Shine Cargo Website</p>
      <hr style="border: 1px solid #eee;">
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.firstName} ${formData.lastName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${formData.email}">${formData.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.phone || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.company || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Service Required:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.service}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Origin:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.origin || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Destination:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.destination || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Cargo Details:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.cargoDetails || 'Not provided'}</td>
        </tr>
      </table>
      
      <div style="margin-top: 20px;">
        <h3 style="color: #2c3e50;">Message:</h3>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
          ${formData.message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This email was sent from the Super Shine Cargo contact form.<br>
        Reply directly to this email to respond to the customer.
      </p>
    </div>
    `

    const emailText = `
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

    // CRITICAL FIX: Use your verified domain for the 'from' address
    const emailData = {
      from: 'noreply@supershinecargo.com',      // FIXED: Use your verified domain
      to: 'cargo.supershine@gmail.com',        // This should be the email you signed up with for Resend trial
      subject: emailSubject,
      html: emailHtml,                         // Added HTML version
      text: emailText,                         // Keep text version for fallback
      replyTo: formData.email                  // Customer can be replied to directly
    }

    console.log('Sending email via Resend:', JSON.stringify({
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      replyTo: emailData.replyTo
    }, null, 2))

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': Bearer ${RESEND_API_KEY},
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailData.from,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        reply_to: emailData.replyTo
      }),
    })

    const responseData = await response.json()
    console.log('Resend API response:', responseData)

    if (response.ok) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Contact form submitted successfully',
          emailId: responseData.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('Resend API error:', responseData)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email', 
          details: responseData.message || 'Unknown error' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in send-contact-email function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process contact form', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})