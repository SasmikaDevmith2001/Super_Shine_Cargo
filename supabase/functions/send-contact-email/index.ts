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

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.service || !formData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GMAIL_USER = Deno.env.get('GMAIL_USER')
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')
    const RECIPIENT_EMAIL = Deno.env.get('RECIPIENT_EMAIL') || GMAIL_USER

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error('Missing Gmail credentials in environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
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

    const response = await sendEmailViaSMTP({
      from: GMAIL_USER,
      to: RECIPIENT_EMAIL,
      subject: emailSubject,
      text: emailBody,
      replyTo: formData.email
    }, GMAIL_USER, GMAIL_APP_PASSWORD)

    if (response.success) {
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error(response.error || 'Failed to send email')
    }

  } catch (error) {
    console.error('Error in send-contact-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Replace your sendEmailViaSMTP function with this:
async function sendEmailViaSMTP(emailData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const RESEND_API_KEY = Deno.env.get('re_3Tp6HNGj_LqBu2Z6gkBr145SM84xCXr8d');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Super Shine Cargo <itworked@yoyo.com>', // Use your domain
        to: [emailData.to],
        subject: emailData.subject,
        text: emailData.text,
        reply_to: emailData.replyTo
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}