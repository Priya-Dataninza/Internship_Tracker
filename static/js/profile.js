
document.addEventListener("DOMContentLoaded", async function () {

    console.log("PROFILE JS LOADED");


    /*
    ============================================
    GET JWT TOKEN
    ============================================
    */

    const token = localStorage.getItem("access_token");

    if (!token) {
        console.log("No access token found.");

        // User is not logged in
        window.location.href = loginUrl;
        return;
    }


    /*
    ============================================
    FETCH PROFILE
    ============================================
    */

    try {

        const response = await fetch(profileApiUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });


        /*
        ========================================
        HANDLE AUTHENTICATION ERRORS
        ========================================
        */

        if (response.status === 401) {

            console.log("Access token expired or invalid.");

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            window.location.href = loginUrl;

            return;
        }


        if (!response.ok) {

            console.error(
                "Profile API error:",
                response.status
            );

            return;
        }


        /*
        ========================================
        GET PROFILE DATA
        ========================================
        */

        const profile = await response.json();

        console.log("PROFILE DATA:", profile);


        /*
        ============================================
        POPULATE PROFILE
        ============================================
        */

        populateProfile(profile);


        /*
        ============================================
        PROFILE COMPLETION
        ============================================
        */

        calculateProfileCompletion(profile);


    } catch (error) {

        console.error(
            "Error loading profile:",
            error
        );

    }


    /*
    ============================================
    POPULATE PROFILE FUNCTION
    ============================================
    */

    function populateProfile(profile) {

        /*
        ----------------------------------------
        BASIC INFORMATION
        ----------------------------------------
        */

        const nameElement =
            document.querySelector(".profile-main-info h2");

        if (nameElement) {
            nameElement.textContent =
                profile.full_name || "Your Name";
        }


        const emailElement =
            document.querySelector(".profile-main-info .email");

        if (emailElement && profile.email) {
            emailElement.textContent = profile.email;
        }


        /*
        ----------------------------------------
        BIO
        ----------------------------------------
        */

        const bioElement =
            document.querySelector(".profile-bio");

        if (bioElement) {

            bioElement.textContent =
                profile.bio || "No bio added yet.";
        }


        /*
        ----------------------------------------
        PERSONAL INFORMATION
        ----------------------------------------
        */

        setInformationValue(
            "phone",
            profile.phone
        );


        /*
        ----------------------------------------
        EDUCATION
        ----------------------------------------
        */

        setInformationValue(
            "college",
            profile.college
        );

        setInformationValue(
            "degree",
            profile.degree
        );

        setInformationValue(
            "branch",
            profile.branch
        );

        setInformationValue(
            "graduationYear",
            profile.graduation_year
        );


        /*
        ----------------------------------------
        SOCIAL LINKS
        ----------------------------------------
        */

        setSocialLink(
            ".social-links .social-link:nth-child(1)",
            profile.linkedin
        );

        setSocialLink(
            ".social-links .social-link:nth-child(2)",
            profile.github
        );

        setSocialLink(
            ".social-links .social-link:nth-child(3)",
            profile.portfolio
        );


        /*
        ----------------------------------------
        PROFILE PICTURE
        ----------------------------------------
        */

        if (profile.profile_picture) {

            const profileImage =
                document.querySelector(".profile-avatar img");

            if (profileImage) {
                profileImage.src =
                    profile.profile_picture;
            }
        }


        /*
        ----------------------------------------
        RESUME
        ----------------------------------------
        */

        const resumeBox =
            document.querySelector(".resume-box");

        if (resumeBox) {

            if (profile.resume) {

                resumeBox.style.display = "block";

            } else {

                resumeBox.style.display = "none";
            }
        }
    }


    /*
    ============================================
    SET INFORMATION VALUE
    ============================================
    */

    function setInformationValue(field, value) {

        const selectors = {

            phone:
                ".information-item:nth-child(3) .information-value",

            college:
                ".profile-grid .card:nth-child(1) .information-item:nth-child(1) .information-value",

            degree:
                ".profile-grid .card:nth-child(2) .information-item:nth-child(2) .information-value",

            branch:
                ".profile-grid .card:nth-child(2) .information-item:nth-child(3) .information-value",

            graduationYear:
                ".profile-grid .card:nth-child(2) .information-item:nth-child(4) .information-value"
        };


        const element =
            document.querySelector(selectors[field]);


        if (!element) {
            return;
        }


        element.textContent =
            value || "Not provided";
    }


    /*
    ============================================
    SET SOCIAL LINK
    ============================================
    */

    function setSocialLink(selector, url) {

        const element =
            document.querySelector(selector);


        if (!element) {
            return;
        }


        if (url) {

            element.href = url;
            element.style.display = "flex";

        } else {

            element.removeAttribute("href");
        }
    }


    /*
    ============================================
    PROFILE COMPLETION
    ============================================
    */

    function calculateProfileCompletion(profile) {

        const fields = [

            profile.full_name,
            profile.phone,
            profile.college,
            profile.degree,
            profile.branch,
            profile.graduation_year,
            profile.linkedin,
            profile.github,
            profile.portfolio

        ];


        const completedFields =
            fields.filter(function (value) {

                return (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                );

            }).length;


        const totalFields = fields.length;


        const percentage = Math.round(
            (completedFields / totalFields) * 100
        );


        /*
        ----------------------------------------
        UPDATE PERCENTAGE
        ----------------------------------------
        */

        const percentageElement =
            document.getElementById(
                "completionPercentage"
            );


        if (percentageElement) {

            percentageElement.textContent =
                `${percentage}%`;
        }


        /*
        ----------------------------------------
        UPDATE PROGRESS BAR
        ----------------------------------------
        */

        const progressBar =
            document.getElementById(
                "profileProgress"
            );


        if (progressBar) {

            progressBar.style.width =
                `${percentage}%`;
        }


        /*
        ----------------------------------------
        UPDATE MESSAGE
        ----------------------------------------
        */

        const message =
            document.getElementById(
                "completionMessage"
            );


        if (!message) {
            return;
        }


        if (percentage === 100) {

            message.textContent =
                "Your profile is complete.";

        } else if (percentage >= 75) {

            message.textContent =
                "Almost there! Complete the remaining details.";

        } else if (percentage >= 50) {

            message.textContent =
                "Good progress. Add a few more details.";

        } else {

            message.textContent =
                "Complete your profile to improve your profile quality.";
        }
    }


    /*
    ============================================
    EDIT PROFILE
    ============================================
    */

    const editProfileBtn =
        document.getElementById("editProfileBtn");


    if (editProfileBtn) {

        editProfileBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    editProfileUrl;
            }
        );
    }

});
