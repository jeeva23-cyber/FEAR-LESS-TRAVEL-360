# FearLess Travel 360 - Live Setup and Deployment Guide

This guide details the steps to migrate the database schemas to **Supabase**, push the source files to **GitHub**, and publish the portal live on **Vercel**.

---

## Part 1: Supabase Database Configuration

Create a free project at [supabase.com](https://supabase.com). Once created, navigate to the **SQL Editor** tab on the left sidebar and execute the following SQL DDL query scripts to establish the database structure:

### 1. Database Table Definitions

```sql
-- 1. Profiles Table (Holds metadata linked to Supabase Auth Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  emergency_contact TEXT,
  address TEXT,
  blood_group TEXT,
  avatar_url TEXT,
  reg_date DATE DEFAULT CURRENT_DATE
);

-- 2. Incidents Table (Reported tourist issues)
CREATE TABLE public.incidents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  tourist_name TEXT,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'under review',
  date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SOS Alerts Table (Emergency alarm triggers logs)
CREATE TABLE public.sos_alerts (
  id TEXT PRIMARY KEY,
  tourist_name TEXT,
  coordinates TEXT,
  address TEXT,
  time TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Active'
);
```

### 2. Auto-Profile Creation Trigger (Optional, highly recommended)
Run this SQL block to automatically create a row in the `profiles` table whenever a new user registers through Supabase authentication:

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, emergency_contact, address, blood_group, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New Tourist'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'emergencyContact',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'bloodGroup',
    new.raw_user_meta_data->>'avatar'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Part 2: Connect Frontend to Supabase

1. In Supabase, go to **Project Settings** > **API**.
2. Copy your **Project URL** and **anon public key**.
3. Open `js/config.js` and paste them into the placeholders:
   ```javascript
   const SUPABASE_URL = "https://your-project-id.supabase.co";
   const SUPABASE_ANON_KEY = "your-anon-public-key-here";
   ```

---

## Part 3: Publish Source Code to GitHub

Open **PowerShell** or **Git Bash** on your computer and run these commands to push the project directory to your GitHub account:

```bash
# Navigate to project folder
cd "C:\Users\Jeeva Rathinam\.gemini\antigravity\scratch\FearLessTravel360"

# Initialize local git repository
git init

# Add all files to stage
git add .

# Commit files locally
git commit -m "feat: init FearLess Travel 360 portal with Supabase integration"

# Link to your remote GitHub Repository
# (Replace USERNAME and REPO_NAME with your actual GitHub username and repository name)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Rename branch
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## Part 4: Host Live on Vercel

1. Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New** > **Project**.
3. Under "Import Git Repository", find your pushed project (`REPO_NAME`) and click **Import**.
4. Leave the **Build and Development Settings** at default (as it is a static HTML/CSS/JS application).
5. Click **Deploy**.

Vercel will build and launch your application. Once finished, it will provide a live public link (e.g. `https://fearless-travel-360.vercel.app`).
