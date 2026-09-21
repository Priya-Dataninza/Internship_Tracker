from django.shortcuts import render,redirect
from django.http import HttpResponse
from django.contrib.auth import login,logout
from .forms import LoginForm, RegistrationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from home.models import Profile

from django.contrib.messages import get_messages


# Create your views here.
def register_view(request):

    if request.method == "POST":
    
        form = RegistrationForm(request.POST)

        if form.is_valid():
            form.save()
            messages.success(request, "Registration successful!")
            return redirect('login')

        else:
            pass 

    else:
        form = RegistrationForm()

    return render(request, 'register.html', {'form': form})

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout as django_backend_logout
from django.contrib import messages
from django.contrib.messages import get_messages

def login_view(request):
    
    form = LoginForm(request, data=request.POST or None)

    if request.method == "POST" and form.is_valid():
        login(request, form.get_user())
        messages.success(request, "Login successful!")
        return redirect("dashboard")
        
    return render(request, 'login.html', {'form': form})





def dashboard_view(request):
    return render(request, 'dashboard.html')

def internships_view(request):
    return render(request, 'opportunities.html')

def application_view(request):
    return render(request,'applications.html')


def profile_view(request):
    return render(request,'profile.html')