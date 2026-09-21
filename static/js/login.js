console.log("LOGIN JS LOADED");

document.addEventListener("DOMContentLoaded", function () {
    const toggleButtons = document.querySelectorAll(".password-toggle");

    toggleButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const input = button.parentElement.querySelector("input");

            if (!input) return;

            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            button.textContent = isPassword ? "Hide" : "Show";
        });
    });

    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("id_username").value;
        const password = document.getElementById("id_password").value;

        try {
            const response = await fetch(apiLoginUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            

            if (response.ok) {
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);

                console.log("Login successful. Redirecting...");
                window.location.href = dashboardUrl;
            } else {
                console.log(data);
                alert("Invalid username or password.");
            }

        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong. Please try again.");
        }
    });
});