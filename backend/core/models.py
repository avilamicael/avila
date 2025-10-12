from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import os


class UppercaseMixin:
    """Mixin para converter campos especificados para uppercase automaticamente"""

    # Defina esta lista em cada model que usar o mixin
    uppercase_fields = []

    def save(self, *args, **kwargs):
        """Converte campos especificados para uppercase antes de salvar"""
        for field_name in self.uppercase_fields:
            value = getattr(self, field_name, None)
            if value and isinstance(value, str):
                setattr(self, field_name, value.upper())
        super().save(*args, **kwargs)


class BaseModel(models.Model):
    """Model base com campos comuns"""
    id = models.AutoField(primary_key=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class TenantAwareModel(BaseModel):
    """Model base para modelos multi-tenant"""
    tenant = models.ForeignKey(
        'tenant.Tenant',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_related',
        verbose_name='Empresa'
    )
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['tenant', '-created_at']),
        ]


class SoftDeleteModel(models.Model):
    """Model com soft delete"""
    is_active = models.BooleanField('Ativo', default=True)
    deleted_at = models.DateTimeField('Deletado em', null=True, blank=True)
    deleted_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_deleted'
    )

    def delete(self, user=None, **kwargs):
        """Soft delete ao invés de deletar fisicamente"""
        self.is_active = False
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save()

    def hard_delete(self):
        """Delete físico quando necessário"""
        super().delete()

    class Meta:
        abstract = True


def attachment_upload_path(instance, filename):
    """
    Define o caminho de upload dos anexos
    Organiza por: tenant/app/model/ano/mes/filename (se houver tenant)
    ou: app/model/ano/mes/filename (se não houver tenant)
    """
    content_type = instance.content_type
    app_label = content_type.app_label
    model_name = content_type.model
    date = timezone.now()

    # Remove caracteres especiais do filename
    filename = os.path.basename(filename)

    # Verifica se o objeto relacionado tem tenant
    tenant_path = ''
    if instance.content_object and hasattr(instance.content_object, 'tenant'):
        tenant = instance.content_object.tenant
        # Usa o slug do tenant para organizar
        tenant_path = f'{tenant.slug}/'

    return f'attachments/{tenant_path}{app_label}/{model_name}/{date.year}/{date.month:02d}/{filename}'


class Attachment(BaseModel):
    """
    Modelo genérico para anexos que pode ser usado por qualquer outro modelo.
    Usa GenericForeignKey para relacionamento polimórfico.
    """
    # GenericForeignKey fields
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Conteúdo'
    )
    object_id = models.PositiveIntegerField(verbose_name='ID do Objeto')
    content_object = GenericForeignKey('content_type', 'object_id')

    # Arquivo
    file = models.FileField(
        'Arquivo',
        upload_to=attachment_upload_path,
        max_length=500
    )

    # Metadados
    original_filename = models.CharField('Nome Original', max_length=255)
    file_size = models.PositiveBigIntegerField('Tamanho (bytes)', default=0)
    file_type = models.CharField('Tipo de Arquivo', max_length=100, blank=True)
    description = models.TextField('Descrição', blank=True)

    # Usuário que fez upload
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_attachments',
        verbose_name='Enviado por'
    )

    # Ordenação
    order = models.PositiveIntegerField('Ordem', default=0)

    class Meta:
        verbose_name = 'Anexo'
        verbose_name_plural = 'Anexos'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['content_type', 'object_id', 'order']),
        ]

    def __str__(self):
        return f"{self.original_filename} ({self.get_file_size_display()})"

    def save(self, *args, **kwargs):
        """Salva metadados do arquivo automaticamente"""
        if self.file:
            # Salva o nome original
            if not self.original_filename:
                self.original_filename = os.path.basename(self.file.name)

            # Salva o tamanho
            if self.file_size == 0:
                self.file_size = self.file.size

            # Detecta o tipo de arquivo
            if not self.file_type:
                self.file_type = self.get_content_type()

        super().save(*args, **kwargs)

    def get_content_type(self):
        """Retorna o content type do arquivo baseado na extensão"""
        import mimetypes
        if self.file:
            content_type, _ = mimetypes.guess_type(self.file.name)
            return content_type or 'application/octet-stream'
        return ''

    def get_file_size_display(self):
        """Retorna o tamanho do arquivo em formato legível"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    def get_extension(self):
        """Retorna a extensão do arquivo"""
        return os.path.splitext(self.original_filename)[1].lower()

    def is_image(self):
        """Verifica se o arquivo é uma imagem"""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
        return self.get_extension() in image_extensions

    def is_document(self):
        """Verifica se o arquivo é um documento"""
        doc_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt']
        return self.get_extension() in doc_extensions