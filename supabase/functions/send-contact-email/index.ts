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

    // Add debug logging
    console.log('Function called, checking environment variables...')

    const formData: ContactFormData = await req.json()
    console.log('Form data received:', {
      firstName: formData.firstName,
      email: formData.email,
      service: formData.service
    })

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.service || !formData.message) {
      console.error('Missing required fields:', {
        firstName: !!formData.firstName,
        lastName: !!formData.lastName,
        email: !!formData.email,
        service: !!formData.service,
        message: !!formData.message
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for API key with detailed logging
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    console.log('Environment variables check:', {
      hasResendKey: !!RESEND_API_KEY,
      keyLength: RESEND_API_KEY ? RESEND_API_KEY.length : 0,
      keyPrefix: RESEND_API_KEY ? RESEND_API_KEY.substring(0, 10) + '...' : 'undefined'
    })

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing from environment variables')
      console.error('Available environment variables:', Object.keys(Deno.env.toObject()))
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error - Missing API key',
          debug: 'RESEND_API_KEY not found in environment'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate API key format
    if (!RESEND_API_KEY.startsWith('re_')) {
      console.error('Invalid RESEND_API_KEY format - should start with re_')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error - Invalid API key format',
          debug: 'API key should start with re_'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailSubject = New Contact Form Submission from ${formData.firstName} ${formData.lastName}
    
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

    const emailData = {
      from: 'noreply@supershinecargo.com',
      to: 'cargo.supershine@gmail.com',
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      replyTo: formData.email
    }

    console.log('Attempting to send email with data:', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      replyTo: emailData.replyTo
    })

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
    console.log('Resend API response status:', response.status)
    console.log('Resend API response data:', responseData)

    if (response.ok) {
      console.log('Email sent successfully with ID:', responseData.id)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Contact form submitted successfully',
          emailId: responseData.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('Resend API error response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      })
      
      // Return more specific error messages
      let errorMessage = 'Failed to send email'
      if (responseData.message) {
        errorMessage = responseData.message
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: responseData,
          debug: HTTP ${response.status}: ${response.statusText}
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Unhandled error in send-contact-email function:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process contact form',
        details: error.message,
        type: error.name
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})