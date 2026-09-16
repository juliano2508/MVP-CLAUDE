import logging
import smtplib
from datetime import date, time
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger("agendafacil.notifications")


def send_appointment_confirmation(
    cliente_nome: str,
    cliente_email: str,
    nome_negocio: str,
    servico_nome: str,
    data_agendamento: date,
    hora_inicio: time,
) -> None:
    subject = f"Agendamento confirmado - {nome_negocio}"
    body = (
        f"Olá {cliente_nome},\n\n"
        f"Seu agendamento foi confirmado com sucesso.\n\n"
        f"Negócio: {nome_negocio}\n"
        f"Serviço: {servico_nome}\n"
        f"Data: {data_agendamento.strftime('%d/%m/%Y')}\n"
        f"Horário: {hora_inicio.strftime('%H:%M')}\n\n"
        f"Até breve!"
    )

    if not settings.smtp_host:
        logger.info("SMTP não configurado; email de confirmação simulado:\n%s\n%s", subject, body)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from
    message["To"] = cliente_email
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            smtp.starttls()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        logger.exception("Falha ao enviar email de confirmação para %s", cliente_email)
