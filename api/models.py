from django.db import models
from home.models import User

# Create your models here.

class Internship(models.Model):
    sources = [
        ('manual', 'Manual'),
        ('lever', 'Lever'),
        ('greenhouse', 'Greenhouse'),
    ]

    job_title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255,blank=True)
    description = models.TextField(blank=True)
    apply_link = models.URLField(max_length=1000)
    hosted_url = models.URLField(max_length=1000,blank=True)

    ##api tracking fields
    source = models.CharField(max_length=20, choices=sources, default='manual')
    source_id = models.CharField(max_length=255, blank=True, null=True)
    posted_at = models.DateTimeField(blank=True, null=True)
    


    ##app related fields
    created_at = models.DateTimeField(auto_now_add=True)    
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields = ['source','source_id'],
                name = "unique_external_internship")
        ]

    def __str__(self):
        return f"{self.job_title} ----{self.company_name}"


class Applications(models.Model):

    STATUS_CHOICES = [
        ("applied", "Applied"),
        ("online_assessment", "Online Assessment"),
        ("interview", "Interview"),
        ("technical_interview", "Technical Interview"),
        ("hr_interview", "HR Interview"),
        ("offer", "Offer"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
    ]

    applicant = models.ForeignKey(User,on_delete=models.CASCADE,related_name="applications")
    internship_applied = models.ForeignKey(Internship,on_delete=models.CASCADE,related_name="applications")
    applied_on = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(null=True,blank=True)
    interview_date = models.DateTimeField(blank=True,null=True)
    status = models.CharField(max_length=30,choices=STATUS_CHOICES,default="applied")

    class Meta:
        constraints = [
            models.UniqueConstraint(
            fields = ['applicant','internship_applied'],
            name = "user_unique_internship"
        )
        ]

    def __str__(self):
        return f"{self.applicant}---{self.internship_applied}"




    
