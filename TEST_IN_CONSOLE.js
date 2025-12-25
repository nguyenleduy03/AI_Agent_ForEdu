// PASTE CODE NÀY VÀO CONSOLE TAB (F12 → Console)
// Sau đó nhấn Enter

console.clear();
console.log('🧪 TESTING EMAIL DRAFT API...');

fetch('http://localhost:8000/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        message: 'gửi email cho test@gmail.com hỏi ăn cơm chưa',
        model: 'gemini-2.5-flash',
        ai_provider: 'groq',
        use_rag: false
    })
})
.then(response => response.json())
.then(data => {
    console.log('=' .repeat(60));
    console.log('📧 API RESPONSE:');
    console.log('=' .repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log('=' .repeat(60));
    
    if (data.email_draft) {
        console.log('✅ email_draft EXISTS!');
        console.log('   to:', data.email_draft.to);
        console.log('   subject:', data.email_draft.subject);
        console.log('   body:', data.email_draft.body.substring(0, 100) + '...');
    } else {
        console.log('❌ email_draft is NULL or UNDEFINED!');
        console.log('Response keys:', Object.keys(data));
    }
})
.catch(error => {
    console.error('❌ ERROR:', error);
});
