import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

const REAL_SUPABASE_URL = 'https://otdqdmihcadeusslgrsl.supabase.co';
const REAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZHFkbWloY2FkZXVzc2xncnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODU2MjksImV4cCI6MjA5NjM2MTYyOX0.-bTJg-LlIHE5mupk2O4dqnUzxR6lJgrMlspowEAzG3k';

const supabase = createClient(REAL_SUPABASE_URL, REAL_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  const { petition, cagnotte, benevolat, mission } = req.query;

  let title = "Sunu Yité | Mobilisation Citoyenne au Sénégal";
  let description = "Sunu Yité - Plateforme web et mobile de mobilisation citoyenne et de financement participatif solidaire au Sénégal. Pétitions sécurisées par OTP SMS, transparence totale des dépenses, et dons via Wave, Orange Money et Stripe.";
  let ogImage = "https://sunuyite.vercel.app/logo.png";
  let ogUrl = "";

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'sunuyite.vercel.app';
  ogUrl = `${proto}://${host}${req.url}`;

  try {
    if (petition) {
      const { data, error } = await supabase
        .from('petitions')
        .select('title, description, cover_image')
        .eq('id', petition)
        .single();
      if (!error && data) {
        if (data.title) title = `Pétition : ${data.title}`;
        const rawDesc = data.description || '';
        description = rawDesc.slice(0, 160) + (rawDesc.length > 160 ? '...' : '');
        ogImage = data.cover_image || ogImage;
      }
    } else if (cagnotte) {
      const { data, error } = await supabase
        .from('cagnottes')
        .select('title, description, cover_image')
        .eq('id', cagnotte)
        .single();
      if (!error && data) {
        if (data.title) title = `Cagnotte : ${data.title}`;
        const rawDesc = data.description || '';
        description = rawDesc.slice(0, 160) + (rawDesc.length > 160 ? '...' : '');
        ogImage = data.cover_image || ogImage;
      }
    } else if (benevolat || mission) {
      const id = benevolat || mission;
      const { data, error } = await supabase
        .from('volunteer_missions')
        .select('title, description, cover_image')
        .eq('id', id)
        .single();
      if (!error && data) {
        if (data.title) title = `Mission : ${data.title}`;
        const rawDesc = data.description || '';
        description = rawDesc.slice(0, 160) + (rawDesc.length > 160 ? '...' : '');
        ogImage = data.cover_image || ogImage;
      }
    }
  } catch (err) {
    console.error("Error fetching cause details:", err);
  }

  // Load the index.html template
  let htmlTemplate = '';
  try {
    // Attempt local file read from dist/index.html (bundled by Vercel)
    const localPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(localPath)) {
      htmlTemplate = fs.readFileSync(localPath, 'utf8');
    } else {
      // Fallback: Read index.html from root folder
      const rootPath = path.join(process.cwd(), 'index.html');
      if (fs.existsSync(rootPath)) {
        htmlTemplate = fs.readFileSync(rootPath, 'utf8');
      }
    }
  } catch (err) {
    console.error("Error reading local index.html:", err);
  }

  // If local read fails, fetch it via network
  if (!htmlTemplate) {
    try {
      const response = await fetch(`${proto}://${host}/index.html`);
      if (response.ok) {
        htmlTemplate = await response.text();
      }
    } catch (err) {
      console.error("Error fetching index.html over network:", err);
    }
  }

  // If we still don't have a template, use a minimal HTML shell
  if (!htmlTemplate) {
    htmlTemplate = `
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/png" href="/logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title}</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.tsx"></script>
        </body>
      </html>
    `;
  }

  // Inject meta tags
  // Replace <title>...</title>
  htmlTemplate = htmlTemplate.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${title} | Sunu Yité</title>`
  );

  // Dynamic Open Graph & Twitter meta tags to inject
  const metaTags = `
    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')} | Sunu Yité" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${ogUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')} | Sunu Yité" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${ogImage}" />
  `;

  // Inject the new meta tags right after <head>
  htmlTemplate = htmlTemplate.replace('<head>', `<head>${metaTags}`);

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(htmlTemplate);
}
