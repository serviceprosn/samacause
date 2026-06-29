const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://otdqdmihcadeusslgrsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZHFkbWloY2FkZXVzc2xncnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODU2MjksImV4cCI6MjA5NjM2MTYyOX0.-bTJg-LlIHE5mupk2O4dqnUzxR6lJgrMlspowEAzG3k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  const email = `testuser_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const password = 'TestPassword123!';
  
  console.log(`Step 1: Attempting to sign up user ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test User',
        phone: '+221770000000',
        country: 'Sénégal',
        region: 'Dakar',
        role: 'citizen',
        verified: false,
        trust_score: 50
      }
    }
  });

  if (signUpError) {
    console.error("❌ Sign up error:", signUpError.message);
    return;
  }
  
  console.log("✅ Sign up success!");
  console.log("Session:", signUpData.session ? "Active (Auto-login)" : "Null (Email confirmation required)");
  
  let session = signUpData.session;
  
  if (!session) {
    console.log("\nStep 2: Attempting to sign in with password...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error("❌ Sign in error (this confirms email verification is required):", signInError.message);
      return;
    }
    
    console.log("✅ Sign in success!");
    session = signInData.session;
  }

  const user = session.user;
  console.log(`\nStep 3: User ID is ${user.id}. Attempting to insert a cagnotte...`);
  
  const newId = `cag_test_${Math.random().toString(36).substr(2, 9)}`;
  const newCag = {
    id: newId,
    title: 'Test Cagnotte Title',
    description: 'Test Description',
    cover_image: '',
    category: 'sante',
    amount_collected: 0,
    amount_target: 500000,
    location: 'Dakar',
    created_at: new Date().toISOString().split('T')[0],
    status: 'active',
    organizer: {
      id: user.id,
      name: 'Test User',
      avatar: '',
      verified: false,
      trustScore: 50
    },
    is_diaspora_targeted: false,
    updates: [],
    expenses: [],
    donors: [],
    documents: [],
    gallery: [],
    viewed_by_admin: false,
    image_before: '',
    image_after: ''
  };

  const { data: insertCag, error: insertCagError } = await supabase
    .from('cagnottes')
    .insert([newCag])
    .select();

  if (insertCagError) {
    console.error("❌ Error inserting cagnotte:", insertCagError);
  } else {
    console.log("✅ Cagnotte inserted successfully!", insertCag);
  }

  console.log("\nStep 4: Attempting to insert a petition...");
  const newPetId = `pet_test_${Math.random().toString(36).substr(2, 9)}`;
  const newPet = {
    id: newPetId,
    title: 'Test Petition Title',
    description: 'Test Description',
    cover_image: '',
    category: 'sante',
    signatures_count: 0,
    signatures_target: 1000,
    recipient: 'Ministère',
    location: 'Dakar',
    date_limit: '2026-12-31',
    created_at: new Date().toISOString().split('T')[0],
    status: 'active',
    organizer: {
      id: user.id,
      name: 'Test User',
      avatar: '',
      verified: false,
      trustScore: 50
    },
    updates: [],
    signers: [],
    boosted: false,
    viewed_by_admin: false,
    image_before: '',
    image_after: '',
    gallery: []
  };

  const { data: insertPet, error: insertPetError } = await supabase
    .from('petitions')
    .insert([newPet])
    .select();

  if (insertPetError) {
    console.error("❌ Error inserting petition:", insertPetError);
  } else {
    console.log("✅ Petition inserted successfully!", insertPet);
  }
}

runTest();
