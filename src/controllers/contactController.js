import sendEmail from "../utils/sendEmail.js";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const isValidEmail = (value = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

export const submitContactMessage = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const message = String(req.body.message || "").trim();

    if (!name || !email || !message) {
      const error = new Error("Name, email, and message are required.");
      error.statusCode = 400;
      throw error;
    }

    if (!isValidEmail(email)) {
      const error = new Error("Please provide a valid email address.");
      error.statusCode = 400;
      throw error;
    }

    const recipient = process.env.CONTACT_EMAIL || process.env.EMAIL_FROM;

    if (!recipient) {
      const error = new Error("Contact email recipient is not configured.");
      error.statusCode = 500;
      throw error;
    }

    await sendEmail({
      to: recipient,
      replyTo: email,
      subject: `New Event Orbit contact message from ${name}`,
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    next(error);
  }
};
