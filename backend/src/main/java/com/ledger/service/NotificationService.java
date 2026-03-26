package com.ledger.service;

import com.ledger.model.TamperAlert;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class NotificationService {

    private final SimpMessagingTemplate ws;
    private final JavaMailSender mailSender;

    @Value("${mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${alert.email.to:security-team@example.com}")
    private String alertEmailTo;

    @Value("${spring.mail.username:your@gmail.com}")
    private String mailFrom;

    public NotificationService(SimpMessagingTemplate ws, JavaMailSender mailSender) {
        this.ws         = ws;
        this.mailSender = mailSender;
    }

    /** Push a WebSocket notification to all subscribed dashboard clients. */
    public void pushAlert(TamperAlert alert) {
        ws.convertAndSend("/topic/alerts", Map.of(
            "id",          alert.getId(),
            "nodeId",      alert.getNodeId(),
            "severity",    alert.getSeverity(),
            "details",     alert.getDetails() != null ? alert.getDetails() : "",
            "detectedAt",  alert.getDetectedAt().toString(),
            "type",        "TAMPER_ALERT"
        ));
    }

    /** Push a plain status message (e.g. "all clear" after scheduled check). */
    public void pushStatus(String message, boolean tampered) {
        ws.convertAndSend("/topic/alerts", Map.of(
            "type",     "STATUS_UPDATE",
            "message",  message,
            "tampered", tampered
        ));
    }

    /** Send an email alert — only fires when mail.enabled=true. */
    public void sendEmail(TamperAlert alert) {
        if (!mailEnabled) return;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailFrom);
            msg.setTo(alertEmailTo);
            msg.setSubject("[LEDGER ALERT] Tampering detected in " + alert.getNodeId());
            msg.setText(
                "⚠ TAMPERING DETECTED\n\n" +
                "Node     : " + alert.getNodeId()    + "\n" +
                "Severity : " + alert.getSeverity()  + "\n" +
                "Time     : " + alert.getDetectedAt() + "\n" +
                "Details  : " + alert.getDetails()   + "\n\n" +
                "Expected Hash : " + alert.getExpectedHash() + "\n" +
                "Actual Hash   : " + alert.getActualHash()   + "\n\n" +
                "Log in to the Ledger Security Dashboard to investigate."
            );
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[MAIL] Failed to send alert email: " + e.getMessage());
        }
    }
}
