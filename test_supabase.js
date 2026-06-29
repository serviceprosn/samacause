const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://otdqdmihcadeusslgrsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZHFkbWloY2FkZXVzc2xncnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODU2MjksImV4cCI6MjA5NjM2MTYyOX0.-bTJg-LlIHE5mupk2O4dqnUzxR6lJgrMlspowEAzG3k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log("Connecting to Supabase...");
  
  // 1. Check Petitions
  const { data: petitions, error: petError } = await supabase.from('petitions').select('*');
  if (petError) {
    console.error("❌ Error fetching petitions:", petError.message);
  } else {
    console.log(`\n✅ Petitions fetched: ${petitions.length}`);
    petitions.forEach(p => console.log(`- ID: ${p.id}, Title: ${p.title}, Status: ${p.status}`));
  }

  // 2. Check Cagnottes
  const { data: cagnottes, error: cagError } = await supabase.from('cagnottes').select('*');
  if (cagError) {
    console.error("❌ Error fetching cagnottes:", cagError.message);
  } else {
    console.log(`\n✅ Cagnottes fetched: ${cagnottes.length}`);
    cagnottes.forEach(c => console.log(`- ID: ${c.id}, Title: ${c.title}, Status: ${c.status}`));
  }

  // 3. Check Volunteer Missions
  const { data: missions, error: misError } = await supabase.from('volunteer_missions').select('*');
  if (misError) {
    console.error("❌ Error fetching volunteer missions:", misError.message);
  } else {
    console.log(`\n✅ Volunteer missions fetched: ${missions.length}`);
    missions.forEach(m => console.log(`- ID: ${m.id}, Title: ${m.title}, Status: ${m.status}`));
  }
}

runTest();
