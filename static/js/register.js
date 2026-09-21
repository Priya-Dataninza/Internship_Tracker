
        // Form validation and message handling
        const registerForm = document.getElementById('registerForm');
        const emailInput = document.getElementById('id_email');
        const password1Input = document.getElementById('id_password1');
        const password2Input = document.getElementById('id_password2');
        const agreeTermsCheckbox = document.getElementById('agreeTerms');
        const submitBtn = document.getElementById('submitBtn');
        const messagesContainer = document.getElementById('messagesContainer');

        // Validation functions
        function validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

         function checkPasswordStrength(password) {
            const requirements = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password)
            };
            return requirements;
        }

       function validatePassword(password) {
    return password.length >= 8;
}

       

        function updatePasswordRequirements(password) {
            const requirements = checkPasswordStrength(password);
            
            const lengthEl = document.getElementById('requirement-length');
            const uppercaseEl = document.getElementById('requirement-uppercase');
            const lowercaseEl = document.getElementById('requirement-lowercase');
            const numberEl = document.getElementById('requirement-number');

            lengthEl.textContent = (requirements.length ? '✓' : '✗') + ' At least 8 characters';
            lengthEl.style.color = requirements.length ? 'var(--success-color)' : 'var(--text-secondary)';

            uppercaseEl.textContent = (requirements.uppercase ? '✓' : '✗') + ' One uppercase letter';
            uppercaseEl.style.color = requirements.uppercase ? 'var(--success-color)' : 'var(--text-secondary)';

            lowercaseEl.textContent = (requirements.lowercase ? '✓' : '✗') + ' One lowercase letter';
            lowercaseEl.style.color = requirements.lowercase ? 'var(--success-color)' : 'var(--text-secondary)';

            numberEl.textContent = (requirements.number ? '✓' : '✗') + ' One number';
            numberEl.style.color = requirements.number ? 'var(--success-color)' : 'var(--text-secondary)';

            return Object.values(requirements).every(req => req);
        }

        // Show error message
        function showError(input, errorElement, message) {
            input.classList.add('error');
            input.classList.remove('success');
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }

        // Clear error message
        function clearError(input, errorElement) {
            input.classList.remove('error');
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }

        // Show success state
        function showSuccess(input) {
            input.classList.remove('error');
            input.classList.add('success');
        }

        // Display Django messages
        function displayMessages() {
            const messages = document.querySelectorAll('ul.errorlist li');
            messages.forEach(msg => {
                showMessage(msg.textContent, 'error');
            });
        }

        // Show toast message
        function showMessage(text, type = 'info') {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = `
                <span class="message-icon">${type === 'error' ? '✕' : '✓'}</span>
                <span class="message-text">${text}</span>
            `;
            messagesContainer.appendChild(messageDiv);

            setTimeout(() => {
                messageDiv.style.animation = 'slide-out 0.4s ease';
                setTimeout(() => messageDiv.remove(), 400);
            }, 4000);
        }

        // Email validation
        emailInput.addEventListener('blur', () => {
            const email = emailInput.value.trim();
            if (email && !validateEmail(email)) {
                showError(emailInput, document.getElementById('emailError'), 'Please enter a valid email address');
            } else if (email) {
                clearError(emailInput, document.getElementById('emailError'));
                showSuccess(emailInput);
            }
        });

        emailInput.addEventListener('input', () => {
            if (emailInput.classList.contains('error') && validateEmail(emailInput.value)) {
                clearError(emailInput, document.getElementById('emailError'));
            }
        });

        
        // Password validation
        password1Input.addEventListener('input', () => {
            const password = password1Input.value;
            updatePasswordRequirements(password);

            if (password1Input.classList.contains('error') && validatePassword(password)) {
                clearError(password1Input, document.getElementById('password1Error'));
            }

            // Check if passwords match
            if (password2Input.value && password !== password2Input.value) {
                showError(password2Input, document.getElementById('password2Error'), 'Passwords do not match');
            } else if (password2Input.value && password === password2Input.value) {
                clearError(password2Input, document.getElementById('password2Error'));
                showSuccess(password2Input);
            }
        });

        password1Input.addEventListener('blur', () => {
            const password = password1Input.value;
            if (!password) {
                showError(password1Input, document.getElementById('password1Error'), 'Password is required');
            } else if (!validatePassword(password)) {
                showError(password1Input, document.getElementById('password1Error'), 'Password must be at least 8 characters');
            } else {
                clearError(password1Input, document.getElementById('password1Error'));
                showSuccess(password1Input);
            }
        });

        // Confirm password validation
        password2Input.addEventListener('input', () => {
            if (password1Input.value && password2Input.value !== password1Input.value) {
                showError(password2Input, document.getElementById('password2Error'), 'Passwords do not match');
            } else if (password2Input.value === password1Input.value) {
                clearError(password2Input, document.getElementById('password2Error'));
                if (password2Input.value) {
                    showSuccess(password2Input);
                }
            }
        });

        // Form submission
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password1 = password1Input.value;
            const password2 = password2Input.value;
            const agreeTerms = agreeTermsCheckbox.checked;
            let isValid = true;

            // Validate email
            if (!email) {
                showError(emailInput, document.getElementById('emailError'), 'Email is required');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError(emailInput, document.getElementById('emailError'), 'Please enter a valid email address');
                isValid = false;
            }

        

            // Validate password
            if (!password1) {
                showError(password1Input, document.getElementById('password1Error'), 'Password is required');
                isValid = false;
            } else if (!validatePassword(password1)) {
                showError(password1Input, document.getElementById('password1Error'), 'Password must be at least 8 characters');
                isValid = false;
            } 

            // Validate confirm password
            if (!password2) {
                showError(password2Input, document.getElementById('password2Error'), 'Please confirm your password');
                isValid = false;
            } else if (password1 !== password2) {
                showError(password2Input, document.getElementById('password2Error'), 'Passwords do not match');
                isValid = false;
            }

            // Validate terms agreement
            if (!agreeTerms) {
                showMessage('Please agree to the Terms & Conditions', 'error');
                isValid = false;
            }

            if (isValid) {
                // Disable button and show loading state
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
                submitBtn.textContent = 'Creating Account...';

                // Submit form
                setTimeout(() => {
                    registerForm.submit();
                }, 500);
            }
        });

        // Display any Django messages on page load
        window.addEventListener('DOMContentLoaded', () => {
            displayMessages();
        });

        // Prevent form submission on Enter while composing
        registerForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                if (!e.nativeEvent.isComposing && e.keyCode !== 229) {
                    e.preventDefault();
                    registerForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    