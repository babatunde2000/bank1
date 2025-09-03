// Form validation and SMS functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transactionForm');
    const smsPreview = document.getElementById('smsPreview');
    const smsContent = document.getElementById('smsContent');
    const submitBtn = document.getElementById('submitBtn');
    
    // Show loading for 4 seconds on page load
    setTimeout(() => {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }, 4000);
    
    // Set default transaction date to current date/time
    const now = new Date();
    const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('transactionDate').value = isoString;
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return false;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating...';
        
        // Show SMS preview
        showSMSPreview();
        
        // Submit form after showing SMS
        setTimeout(() => {
            // Show loading overlay
            document.getElementById('loadingOverlay').classList.remove('hidden');
            document.querySelector('.loading-text').textContent = 'Processing transaction...';
            
            // Submit form after loading
            setTimeout(() => {
                form.submit();
            }, 4000);
        }, 2000);
    });
    
    // Real-time validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearError);
    });
    
    function validateForm() {
        let isValid = true;
        
        // Validate account name
        const accountName = document.getElementById('accountName');
        if (accountName.value.trim().length < 2) {
            showError(accountName, 'Account name must be at least 2 characters');
            isValid = false;
        }
        
        // Validate bank name
        const bankName = document.getElementById('bankName');
        if (!bankName.value) {
            showError(bankName, 'Please select a bank');
            isValid = false;
        }
        
        // Validate account number
        const accountNumber = document.getElementById('accountNumber');
        if (!/^[0-9]{10}$/.test(accountNumber.value)) {
            showError(accountNumber, 'Account number must be exactly 10 digits');
            isValid = false;
        }
        
        // Validate phone number
        const phoneNumber = document.getElementById('phoneNumber');
        const cleanPhone = phoneNumber.value.replace(/[\s\-\(\)]/g, '');
        if (!/^[\+]?[0-9]{10,15}$/.test(cleanPhone)) {
            showError(phoneNumber, 'Please enter a valid phone number');
            isValid = false;
        }
        
        // Validate amount
        const amount = document.getElementById('amount');
        const amountValue = parseFloat(amount.value.replace(/,/g, ''));
        if (isNaN(amountValue) || amountValue <= 0) {
            showError(amount, 'Please enter a valid amount');
            isValid = false;
        }
        
        // Validate narration
        const narration = document.getElementById('narration');
        if (narration.value.trim().length < 1) {
            showError(narration, 'Narration is required');
            isValid = false;
        }
        
        // Validate transaction date
        const transactionDate = document.getElementById('transactionDate');
        if (!transactionDate.value) {
            showError(transactionDate, 'Transaction date is required');
            isValid = false;
        }
        
        return isValid;
    }
    
    function validateField(e) {
        const field = e.target;
        clearError(e);
        
        switch (field.id) {
            case 'accountNumber':
                if (!/^[0-9]{10}$/.test(field.value)) {
                    showError(field, 'Account number must be exactly 10 digits');
                }
                break;
            case 'amount':
                const amount = parseFloat(field.value.replace(/,/g, ''));
                if (isNaN(amount) || amount <= 0) {
                    showError(field, 'Please enter a valid amount');
                }
                break;
        }
    }
    
    function showError(field, message) {
        clearError({target: field});
        
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }
    
    function clearError(e) {
        const field = e.target;
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    function showSMSPreview() {
        const formData = {
            accountName: document.getElementById('accountName').value,
            bankName: document.getElementById('bankName').value,
            accountNumber: document.getElementById('accountNumber').value,
            amount: parseFloat(document.getElementById('amount').value.replace(/,/g, '')),
            narration: document.getElementById('narration').value,
            transactionDate: new Date(document.getElementById('transactionDate').value)
        };
        
        const smsText = generateSMS(formData);
        smsContent.textContent = smsText;
        smsPreview.classList.remove('hidden');
        
        // Log SMS to console
        console.log('\n=== SMS PREVIEW ===');
        console.log(smsText);
        console.log('==================\n');
        
        // Scroll to SMS preview
        smsPreview.scrollIntoView({ behavior: 'smooth' });
    }
    
    function generateSMS(data) {
        const formatAmount = (amount) => {
            return amount.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };
        
        const formatDate = (date) => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
            const hour12 = date.getHours() % 12 || 12;
            
            return `${day}/${month}/${year} ${hour12.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
        };
        
        const maskedAccount = data.accountNumber.slice(0, 3) + '****' + data.accountNumber.slice(-3);
        const balance = (data.amount + Math.random() * 10000 + 1000).toFixed(2);
        
        return `Acct:${maskedAccount}
DT:${formatDate(data.transactionDate)}
CR/CR//Transfer from ${data.accountName.toUpperCase()}
CR Amt:${formatAmount(data.amount)}
Bal:${formatAmount(balance)}
Dial *966# for quick airtime/Data purchase`;
    }
    
    // Format amount input with proper number formatting
    const amountInput = document.getElementById('amount');
    amountInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^\d.]/g, '');
        
        // Handle decimal places
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        if (parts[1] && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].slice(0, 2);
        }
        
        // Format with commas
        if (parts[0]) {
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            value = parts.join('.');
        }
        
        e.target.value = value;
    });
    
    // Format account number input (digits only)
    const accountNumberInput = document.getElementById('accountNumber');
    accountNumberInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
    
    // Format phone number input
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Format Nigerian phone numbers
        if (value.startsWith('234')) {
            value = '+' + value.slice(0, 13);
        } else if (value.startsWith('0')) {
            value = value.slice(0, 11);
            if (value.length > 4) {
                value = value.slice(0, 4) + ' ' + value.slice(4);
            }
            if (value.length > 9) {
                value = value.slice(0, 9) + ' ' + value.slice(9);
            }
        } else if (value.length > 0) {
            value = '0' + value.slice(0, 10);
        }
        
        e.target.value = value;
    });
});

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}