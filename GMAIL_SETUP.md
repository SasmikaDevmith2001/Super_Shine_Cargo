# Gmail Contact Form Setup Guide

## Step 1: Generate Gmail App Password

1. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to your Google Account settings: https://myaccount.google.com/
   - Navigate to "Security" → "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**:
   - Go to Google Account settings: https://myaccount.google.com/
   - Navigate to "Security" → "2-Step Verification" → "App passwords"
   - Select "Mail" as the app and "Other" as the device
   - Enter "Super Shine Cargo Website" as the device name
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

## Step 2: Set Up Supabase Project

1. **Create Supabase Account**:
   - Go to https://supabase.com/
   - Sign up or log in to your account

2. **Create New Project**:
   - Click "New Project"
   - Choose your organization
   - Enter project name: "Super Shine Cargo"
   - Set a strong database password
   - Choose your region (closest to Sri Lanka)
   - Click "Create new project"

3. **Get Project Credentials**:
   - Go to Project Settings → API
   - Copy the "Project URL" and "anon public" key
   - You'll need these for your environment variables

## Step 3: Configure Environment Variables

1. **In Supabase Dashboard**:
   - Go to Project Settings → Edge Functions → Environment Variables
   - Add these variables:
     - `GMAIL_USER`: your-email@gmail.com
     - `GMAIL_APP_PASSWORD`: your-16-character-app-password
     - `RECIPIENT_EMAIL`: info@supershinecargo.lk (or your preferred email)

2. **In Your Local Project**:
   - Create a `.env` file in your project root
   - Copy the contents from `.env.example`
   - Fill in your actual values

## Step 4: Deploy Edge Function

The Edge Function has been created in `supabase/functions/send-contact-email/`. 

**Note**: Edge Functions are automatically deployed when you connect to Supabase in Bolt. You don't need to manually deploy them.

## Step 5: Connect to Supabase in Bolt

1. Click the "Connect to Supabase" button in the top right of your Bolt interface
2. Follow the prompts to connect your Supabase project
3. This will automatically:
   - Set up your environment variables
   - Deploy the Edge Function
   - Configure your project

## Step 6: Test the Contact Form

1. Fill out the contact form on your website
2. Submit the form
3. Check your email (the one specified in `RECIPIENT_EMAIL`)
4. You should receive the contact form submission

## Troubleshooting

### Common Issues:

1. **"Configuration error" message**:
   - Make sure you've connected to Supabase properly
   - Check that environment variables are set

2. **"Failed to send message" error**:
   - Verify your Gmail App Password is correct
   - Make sure 2FA is enabled on your Google account
   - Check the Edge Function logs in Supabase Dashboard

3. **Email not received**:
   - Check your spam folder
   - Verify the `RECIPIENT_EMAIL` is correct
   - Check Edge Function logs for errors

### Checking Logs:

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions → send-contact-email
3. Check the "Logs" tab for any error messages

## Security Notes

- Never commit your `.env` file to version control
- Use App Passwords instead of your regular Gmail password
- The Edge Function runs server-side, keeping your credentials secure
- All form submissions are validated before processing

## Alternative Email Services

If you prefer not to use Gmail, you can modify the Edge Function to use:
- SendGrid
- Mailgun
- AWS SES
- Postmark

These services often provide better deliverability and more features for transactional emails.