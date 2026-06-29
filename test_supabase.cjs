const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://otdqdmihcadeusslgrsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZHFkbWloY2FkZXVzc2xncnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODU2MjksImV4cCI6MjA5NjM2MTYyOX0.-bTJg-LlIHE5mupk2O4dqnUzxR6lJgrMlspowEAzG3k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log("Connecting to Supabase...");
  
  // 1. Check Petitions
  const { data: petitions, error: petError } = await supabase.from('petitions').select('id, title, status');
  if (petError) {
    console.error("❌ Error fetching petitions:", petError.message);
  } else {
    console.log(`\n✅ Petitions fetched: ${petitions.length}`);
    petitions.forEach(p => console.log(`- ID: ${p.id}, Title: ${p.title}, Status: ${p.status}`));
  }

  // 2. Check Profiles
  const { data: profiles, error: profError } = await supabase.from('profiles').select('id, name, email, role');
  if (profError) {
    console.error("❌ Error fetching profiles:", profError.message);
  } else {
    console.log(`\n✅ Profiles fetched: ${profiles.length}`);
    profiles.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.name}, Email: ${p.email}, Role: ${p.role}`));
  }

  // 3. Check Tontines
  const { data: tontines, error: tonError } = await supabase.from('tontines').select('id, name, organizer');
  if (tonError) {
    console.error("❌ Error fetching tontines:", tonError.message);
  } else {
    console.log(`\n✅ Tontines fetched: ${tontines.length}`);
    tontines.forEach(t => console.log(`- ID: ${t.id}, Name: ${t.name}, Organizer ID: ${t.organizer?.id || t.organizer}`));
  }
}

runTest();
