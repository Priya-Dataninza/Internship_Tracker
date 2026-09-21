
console.log("DASHBOARD JS LOADED");


document.addEventListener("DOMContentLoaded", function () {

    /*
    ============================================================
    1. GET JWT TOKEN
    ============================================================
    */

    const accessToken = localStorage.getItem("access_token");


    /*
    ============================================================
    2. CHECK LOGIN
    ============================================================
    */

    if (!accessToken) {

        console.log("No access token found.");

        window.location.href = loginUrl;

        return;
    }


    /*
    ============================================================
    3. LOAD DASHBOARD DATA
    ============================================================
    */

    loadDashboard();


    /*
    ============================================================
    4. LOGOUT
    ============================================================
    */

    const logoutButton =
        document.getElementById("logoutBtn");

logoutButton.addEventListener('click', function(e) {
    e.preventDefault();

    // 1. Get your refresh token (adjust this based on where you store it)
    const refreshToken = localStorage.getItem('refresh_token'); 

    // 2. Send the POST request to your API view
    fetch("{% url 'logout' %}", {  // Replace 'logout' with your actual URL name
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // If your view requires authentication headers, include them here:
            'Authorization': 'Bearer ' + localStorage.getItem('access_token') 
        },
        body: JSON.stringify({
            "refresh": refreshToken,
            "logout_all_devices": false // Set to true if they clicked a "Logout all" option
        })
    })
    .then(response => {
        if (response.ok) {
            // 3. Clear tokens from frontend storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // 4. Redirect to login or home page clean
            window.location.href = loginUrl; 
        } else {
            alert("Logout failed. Please try again.");
        }
    })
    .catch(error => console.error('Error during logout:', error));
});



    /*
    ============================================================
    5. INTERNSHIP BUTTONS
    ============================================================
    */

    const browseButton =
        document.getElementById("browseInternshipsBtn");

    const findButton =
        document.getElementById("findInternshipsBtn");

    const viewButton =
        document.getElementById("viewInternshipsBtn");


    [browseButton, findButton, viewButton].forEach(function (button) {

        if (!button) return;


        button.addEventListener("click", function (event) {

            event.preventDefault();

            if (internshipsUrl && internshipsUrl !== "#") {

                window.location.href = internshipsUrl;

            }

        });

    });

});


/*
============================================================
LOAD DASHBOARD
============================================================
*/

async function loadDashboard() {

    const token =
        localStorage.getItem("access_token");


    if (!token) {

        window.location.href = loginUrl;

        return;
    }


    try {

        const response = await fetch(
            dashboardApiUrl,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        /*
        ========================================================
        TOKEN EXPIRED / INVALID
        ========================================================
        */

        if (response.status === 401) {

            console.log(
                "Access token expired or invalid."
            );

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            window.location.href = loginUrl;

            return;
        }


        if (!response.ok) {

            console.error(
                "Dashboard API error:",
                response.status
            );

            return;
        }


        const data = await response.json();


        console.log(
            "Dashboard data:",
            data
        );


        /*
        ========================================================
        POPULATE DASHBOARD
        ========================================================
        */

        populateDashboard(data);

    }

    catch (error) {

        console.error(
            "Dashboard request failed:",
            error
        );

    }

}


/*
============================================================
POPULATE DASHBOARD
============================================================
*/

function populateDashboard(data) {


    /*
    ========================================================
    USER
    ========================================================
    */

    const userName =
        document.getElementById("userName");


    if (userName) {

        userName.textContent =
            data.full_name ||
            data.username ||
            "there";

    }


    /*
    ========================================================
    STATISTICS
    ========================================================
    */

    setText(
        "applicationsCount",
        data.statistics?.applications ?? 0
    );


    setText(
        "interviewsCount",
        data.statistics?.interviews ?? 0
    );


    setText(
        "offersCount",
        data.statistics?.offers ?? 0
    );


    setText(
        "rejectedCount",
        data.statistics?.rejected ?? 0
    );


    /*
    ========================================================
    PROFILE COMPLETION
    ========================================================
    */

    const percentage =
        data.profile_completion ?? 0;


    setText(
        "profilePercentage",
        `${percentage}%`
    );


    const progress =
        document.getElementById("profileProgress");


    if (progress) {

        progress.style.width =
            `${percentage}%`;

    }


    const completionMessage =
        document.getElementById(
            "profileCompletionMessage"
        );


    if (completionMessage) {

        if (percentage >= 100) {

            completionMessage.textContent =
                "Your profile is complete.";

        }

        else if (percentage >= 75) {

            completionMessage.textContent =
                "Your profile is almost complete.";

        }

        else if (percentage >= 50) {

            completionMessage.textContent =
                "Add a few more details to strengthen your profile.";

        }

        else {

            completionMessage.textContent =
                "Complete your profile to improve your internship chances.";

        }

    }


    /*
    ========================================================
    APPLICATION PIPELINE
    ========================================================
    */

    const pipeline =
        data.pipeline || {};


    setText(
        "pipelineApplied",
        pipeline.applied ?? 0
    );


    setText(
        "pipelineAssessment",
        pipeline.assessment ?? 0
    );


    setText(
        "pipelineInterview",
        pipeline.interview ?? 0
    );


    setText(
        "pipelineOffer",
        pipeline.offer ?? 0
    );


    setText(
        "pipelineRejected",
        pipeline.rejected ?? 0
    );


    /*
    ========================================================
    UPCOMING INTERVIEWS
    ========================================================
    */

    populateUpcomingInterviews(
        data.upcoming_interviews || []
    );


    /*
    ========================================================
    RECENT APPLICATIONS
    ========================================================
    */

    populateRecentApplications(
        data.recent_applications || []
    );


    /*
    ========================================================
    RECOMMENDED INTERNSHIPS
    ========================================================
    */

    populateInternships(
        data.recommended_internships || []
    );

}


/*
============================================================
UPCOMING INTERVIEWS
============================================================
*/

function populateUpcomingInterviews(interviews) {

    const container =
        document.getElementById(
            "upcomingInterviews"
        );


    if (!container) return;


    if (!interviews.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🎯
                </div>

                <h3>
                    No upcoming interviews
                </h3>

                <p>
                    Your scheduled interviews will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML = "";


    interviews.forEach(function (interview) {

        const item =
            document.createElement("div");


        item.className =
            "interview-item";


        item.innerHTML = `

            <div>

                <strong>
                    ${escapeHTML(
                        interview.title ||
                        "Interview"
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        interview.company ||
                        "Company"
                    )}
                </span>

            </div>

            <div>

                <strong>
                    ${escapeHTML(
                        interview.date ||
                        "Date not available"
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        interview.time ||
                        ""
                    )}
                </span>

            </div>

        `;


        container.appendChild(item);

    });

}


/*
============================================================
RECENT APPLICATIONS
============================================================
*/

function populateRecentApplications(applications) {

    const container =
        document.getElementById(
            "recentApplications"
        );


    if (!container) return;


    if (!applications.length) {

        container.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="table-empty-state">

                        <span>
                            📋
                        </span>

                        <div>

                            <strong>
                                No applications yet
                            </strong>

                            <p>
                                Start tracking your internship applications here.
                            </p>

                        </div>

                    </div>

                </td>

            </tr>
        `;

        return;
    }


    container.innerHTML = "";


    applications.forEach(function (application) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(
                    application.title ||
                    "Internship"
                )}
            </td>

            <td>
                ${escapeHTML(
                    application.company ||
                    "Company"
                )}
            </td>

            <td>
                ${escapeHTML(
                    application.type ||
                    "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    application.applied_date ||
                    "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    application.status ||
                    "Applied"
                )}
            </td>

        `;


        container.appendChild(row);

    });

}


/*
============================================================
RECOMMENDED INTERNSHIPS
============================================================
*/

function populateInternships(internships) {

    const container =
        document.getElementById(
            "recommendedInternships"
        );


    if (!container) return;


    if (!internships.length) {

        container.innerHTML = `

            <div class="internship-placeholder">

                <div class="placeholder-icon">
                    💼
                </div>

                <h3>
                    Discover internships
                </h3>

                <p>
                    Internship opportunities will appear here.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML = "";


    internships.forEach(function (internship) {

        const card =
            document.createElement("article");


        card.className =
            "internship-card";


        card.innerHTML = `

            <div class="internship-company">

                <div class="company-logo">

                    ${
                        internship.logo
                        ? `<img
                            src="${escapeAttribute(internship.logo)}"
                            alt=""
                           >`
                        : "🏢"
                    }

                </div>

                <span>
                    ${escapeHTML(
                        internship.company ||
                        "Company"
                    )}
                </span>

            </div>


            <h3>
                ${escapeHTML(
                    internship.title ||
                    "Internship Opportunity"
                )}
            </h3>


            <p>
                ${escapeHTML(
                    internship.description ||
                    "Explore this internship opportunity."
                )}
            </p>


            <div class="internship-meta">

                <span>
                    📍 ${escapeHTML(
                        internship.location ||
                        "Not specified"
                    )}
                </span>

                <span>
                    💼 ${escapeHTML(
                        internship.commitment ||
                        "Internship"
                    )}
                </span>

            </div>


            <a
                href="${
                    internship.apply_url ||
                    internship.hosted_url ||
                    "#"
                }"
                target="_blank"
                rel="noopener noreferrer"
                class="primary-btn"
            >
                View Opportunity
            </a>

        `;


        container.appendChild(card);

    });

}


/*
============================================================
LOGOUT
============================================================
*/

async function logoutUser() {

    const refreshToken =
        localStorage.getItem("refresh_token");


    try {

        if (refreshToken) {

            await fetch(
                logoutApiUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        refresh_token:
                            refreshToken
                    })
                }
            );

        }

    }

    catch (error) {

        console.error(
            "Logout API error:",
            error
        );

    }

    finally {

        /*
        ================================================
        ALWAYS CLEAR LOCAL TOKENS
        ================================================
        */

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );


        window.location.href =
            loginUrl;

    }

}


/*
============================================================
UTILITY
============================================================
*/

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/*
============================================================
SECURITY HELPERS
============================================================
*/

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}

