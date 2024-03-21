"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls.static import static
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from . import views


urlpatterns = [
    path('', views.frontdoor, name='frontdoor'),

    path('accounts/', include('accounts.urls')),
    path('accounts/', include('accounts.urls_allauth')),
    path('home/', include('home.urls')),
    path('lecture/', include('lecture.urls')),
    path('chat/', include('chat.urls')),
    path('board/', include('board.urls')),
    path('community/', include('board.urls_community')),
    path('notice/', include('board.urls_notice')),
    path('qna/', include('board.urls_qna')),
    path('evaluation/', include('evaluation.urls')),
    path('admin/', admin.site.urls),
    path('ckeditor/', include('ckeditor_uploader.urls'))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
