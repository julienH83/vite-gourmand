const nodemailer = require('nodemailer');
const { escapeHtml } = require('../utils/sanitize');
const logger = require('../utils/logger');

class EmailService {
  constructor(smtpConfig) {
    this._bankAccountName = smtpConfig.bankAccountName;
    this._bankIban = smtpConfig.bankIban;
    this._bankBic = smtpConfig.bankBic;
    this._onSiteAddress = smtpConfig.onSiteAddress;
    this._onSiteHours = smtpConfig.onSiteHours;
    this._onSitePhone = smtpConfig.onSitePhone;
    this._from = smtpConfig.from;
    this._frontendUrl = smtpConfig.frontendUrl;

    if (!smtpConfig.adminEmail) {
      logger.warn('[EmailService] ADMIN_EMAIL non défini — fallback vers SMTP_FROM : %s', this._from);
    }
    this._adminEmail = smtpConfig.adminEmail || this._from;

    // Use Brevo HTTP API if BREVO_API_KEY is set (Render blocks SMTP ports on free tier)
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      const _from = this._from;
      this._transporter = {
        sendMail: async (opts) => {
          const toEmail = typeof opts.to === 'string' ? opts.to : opts.to?.email || opts.to;
          const fromEmail = opts.from || _from;
          const payload = {
            sender: { name: 'Vite & Gourmand', email: fromEmail },
            to: [{ email: toEmail }],
            subject: opts.subject,
            htmlContent: opts.html || `<p>${opts.text || ''}</p>`,
          };
          logger.info({ to: toEmail, subject: opts.subject }, '[Brevo] Sending email');
          const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'accept': 'application/json', 'content-type': 'application/json', 'api-key': brevoKey },
            body: JSON.stringify(payload),
          });
          const body = await res.text();
          if (!res.ok) {
            logger.error({ status: res.status, body }, '[Brevo] API error');
            throw new Error(`Brevo API error ${res.status}: ${body}`);
          }
          logger.info({ body }, '[Brevo] Email sent');
          return { messageId: JSON.parse(body).messageId };
        }
      };
      logger.info('[EmailService] Using Brevo HTTP API');
    } else {
      const port = smtpConfig.port;
      this._transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port,
        secure: port === 465,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        auth: smtpConfig.user ? {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        } : undefined,
      });
      logger.info('[EmailService] Using SMTP transport');
    }
  }

  async sendWelcomeEmail(user) {
    const name = escapeHtml(user.first_name);
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Bienvenue chez Vite & Gourmand !',
      html: `
      <h1>Bienvenue ${name} !</h1>
      <p>Votre compte a été créé avec succès sur <strong>Vite &amp; Gourmand</strong>.</p>
      <p>Vous pouvez maintenant parcourir nos menus et passer commande.</p>
      <p>À très bientôt,<br>L'équipe Vite &amp; Gourmand</p>
    `,
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const name = escapeHtml(user.first_name);
    const resetUrl = `${this._frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe - Vite & Gourmand',
      html: `
      <h1>Réinitialisation du mot de passe</h1>
      <p>Bonjour ${name},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p><a href="${resetUrl}">Cliquez ici pour réinitialiser votre mot de passe</a></p>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `,
    });
  }

  async sendOrderConfirmationEmail(user, order, menu) {
    const name = escapeHtml(user.first_name);
    const menuTitle = escapeHtml(menu.title);
    const address = escapeHtml(order.delivery_address);
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: `Confirmation de commande #${order.id.slice(0, 8)} - Vite & Gourmand`,
      html: `
      <h1>Commande confirmée !</h1>
      <p>Bonjour ${name},</p>
      <p>Votre commande a bien été enregistrée.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td><strong>Menu :</strong></td><td>${menuTitle}</td></tr>
        <tr><td><strong>Personnes :</strong></td><td>${order.nb_persons}</td></tr>
        <tr><td><strong>Date :</strong></td><td>${order.delivery_date}</td></tr>
        <tr><td><strong>Heure :</strong></td><td>${order.delivery_time}</td></tr>
        <tr><td><strong>Adresse :</strong></td><td>${address}</td></tr>
        <tr><td><strong>Prix menu :</strong></td><td>${order.menu_price} €</td></tr>
        <tr><td><strong>Livraison :</strong></td><td>${order.delivery_price} €</td></tr>
        <tr><td><strong>Remise :</strong></td><td>-${order.discount} €</td></tr>
        <tr><td><strong>Total :</strong></td><td><strong>${order.total_price} €</strong></td></tr>
      </table>
      <p>Vous pouvez suivre votre commande depuis votre espace personnel.</p>
    `,
    });
  }

  async sendDepositRequestEmail(user, order, menu) {
    const name = escapeHtml(user.first_name);
    const menuTitle = escapeHtml(menu.title);
    const address = escapeHtml(order.delivery_address);
    const depositAmount = Number(order.deposit_amount || 0).toFixed(2);
    const reference = `CMD ${order.id.slice(0, 8).toUpperCase()}`;
    const orderUrl = `${this._frontendUrl}/dashboard/orders/${order.id}`;

    const hasBank = Boolean(this._bankIban && this._bankBic && this._bankAccountName);
    const hasOnSite = Boolean(this._onSiteAddress);

    const bankBlock = hasBank ? `
      <h3>Paiement par virement bancaire</h3>
      <p>Merci d'indiquer la référence suivante dans le libellé du virement :</p>
      <p><strong>${escapeHtml(reference)}</strong></p>
      <p>
        <strong>Titulaire :</strong> ${escapeHtml(this._bankAccountName)}<br/>
        <strong>IBAN :</strong> ${escapeHtml(this._bankIban)}<br/>
        <strong>BIC :</strong> ${escapeHtml(this._bankBic)}
      </p>
    ` : '';

    const onSiteBlock = hasOnSite ? `
      <h3>Paiement sur place</h3>
      <p>
        Vous pouvez également régler l'acompte directement sur place :<br/>
        <strong>Adresse :</strong> ${escapeHtml(this._onSiteAddress)}<br/>
        ${this._onSiteHours ? `<strong>Horaires :</strong> ${escapeHtml(this._onSiteHours)}<br/>` : ''}
        ${this._onSitePhone ? `<strong>Téléphone :</strong> ${escapeHtml(this._onSitePhone)}<br/>` : ''}
      </p>
    ` : '';

    const paymentIntro = (hasBank || hasOnSite)
      ? `<p>Pour confirmer votre commande, merci de régler l'acompte de <strong>${depositAmount} €</strong>.</p>`
      : `<p>Notre équipe vous contactera prochainement pour les modalités de règlement de l'acompte de <strong>${depositAmount} €</strong>.</p>`;

    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: `Commande #${order.id.slice(0, 8)} — Paiement de l'acompte`,
      html: `
        <h1>Commande enregistrée</h1>
        <p>Bonjour ${name},</p>
        <p>Votre commande a bien été enregistrée. Un acompte est requis pour la confirmer.</p>

        <table style="border-collapse:collapse;width:100%">
          <tr><td><strong>Menu :</strong></td><td>${menuTitle}</td></tr>
          <tr><td><strong>Personnes :</strong></td><td>${order.nb_persons}</td></tr>
          <tr><td><strong>Date :</strong></td><td>${order.delivery_date}</td></tr>
          <tr><td><strong>Heure :</strong></td><td>${order.delivery_time}</td></tr>
          <tr><td><strong>Adresse :</strong></td><td>${address}</td></tr>
          <tr><td><strong>Total :</strong></td><td><strong>${order.total_price} €</strong></td></tr>
          <tr><td><strong>Acompte (30%) :</strong></td><td><strong>${depositAmount} €</strong></td></tr>
        </table>

        ${paymentIntro}

        ${(hasBank || hasOnSite) ? `
          <div style="padding:14px;border:1px solid rgba(200,167,94,.35);border-radius:10px;background:#fff;">
            ${bankBlock}
            ${onSiteBlock}
          </div>
          <p><em>Votre commande sera confirmée dès réception de l'acompte.</em></p>
        ` : ''}

        <p>
          <a href="${orderUrl}" style="background:#c8a75e;color:#0b0b0e;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">
            Suivre ma commande
          </a>
        </p>

        <p>À très bientôt,<br/>L'équipe Vite &amp; Gourmand</p>
      `,
    });
  }

  async sendOrderCompletedEmail(user, order) {
    const name = escapeHtml(user.first_name);
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Votre commande est terminée - Donnez votre avis !',
      html: `
      <h1>Commande terminée</h1>
      <p>Bonjour ${name},</p>
      <p>Votre commande #${order.id.slice(0, 8)} est maintenant terminée.</p>
      <p>Nous espérons que vous avez apprécié nos services !</p>
      <p><a href="${this._frontendUrl}/dashboard/orders/${order.id}">Donnez votre avis</a></p>
      <p>Votre retour est précieux pour nous.</p>
    `,
    });
  }

  async sendMaterialReturnEmail(user, order) {
    const name = escapeHtml(user.first_name);
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'URGENT - Retour du matériel de service - Vite & Gourmand',
      html: `
      <h1>Rappel : retour du matériel</h1>
      <p>Bonjour ${name},</p>
      <p>Suite à votre commande #${order.id.slice(0, 8)}, nous vous rappelons que le matériel de service doit être restitué.</p>
      <p><strong>Attention :</strong> Conformément à nos CGV, tout matériel non restitué sous 10 jours ouvrés sera facturé <strong>600 €</strong>.</p>
      <p>Merci de nous contacter pour organiser la restitution.</p>
    `,
    });
  }

  async sendEmployeeAccountEmail(employee) {
    const name = escapeHtml(employee.first_name);
    await this._transporter.sendMail({
      from: this._from,
      to: employee.email,
      subject: 'Votre compte employé Vite & Gourmand',
      html: `
      <h1>Bienvenue dans l'équipe !</h1>
      <p>Bonjour ${name},</p>
      <p>Un compte employé a été créé pour vous sur Vite &amp; Gourmand.</p>
      <p>Connectez-vous sur <a href="${this._frontendUrl}/login">notre plateforme</a> avec votre adresse email.</p>
      <p>Pour des raisons de sécurité, votre mot de passe ne vous est pas communiqué par email. Contactez votre administrateur.</p>
    `,
    });
  }

  async sendContactEmail(contact) {
    const email = escapeHtml(contact.email);
    const title = escapeHtml(contact.title);
    const description = escapeHtml(contact.description);
    await this._transporter.sendMail({
      from: this._from,
      to: this._adminEmail,
      replyTo: contact.email,
      subject: `[Contact] ${contact.title}`,
      html: `
      <h1>Nouveau message de contact</h1>
      <p><strong>De :</strong> ${email}</p>
      <p><strong>Sujet :</strong> ${title}</p>
      <p><strong>Message :</strong></p>
      <p>${description}</p>
    `,
    });
  }

  async sendContactReplyEmail(originalMessage, replyContent) {
    const title = escapeHtml(originalMessage.title);
    const content = escapeHtml(replyContent);
    await this._transporter.sendMail({
      from: this._from,
      to: originalMessage.email,
      subject: `Re: ${originalMessage.title} - Vite & Gourmand`,
      html: `
      <h1>Réponse à votre message</h1>
      <p>Bonjour,</p>
      <p>L'équipe Vite &amp; Gourmand a répondu à votre message <strong>"${title}"</strong> :</p>
      <blockquote style="border-left: 3px solid #c8a75e; padding-left: 16px; margin: 16px 0; color: #333;">${content}</blockquote>
      <p>Vous pouvez consulter la conversation complète et répondre depuis votre espace personnel sur <a href="${this._frontendUrl}/dashboard/messages">notre plateforme</a>.</p>
      <p>Cordialement,<br/>L'équipe Vite &amp; Gourmand</p>
    `,
    });
  }

  async sendAccountDeletedEmail(user) {
    const name = escapeHtml(user.first_name);
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Confirmation de suppression de compte - Vite & Gourmand',
      html: `
      <h1>Compte supprimé</h1>
      <p>Bonjour ${name},</p>
      <p>Votre compte Vite &amp; Gourmand a été supprimé conformément à votre demande.</p>
      <p>Vos données personnelles ont été anonymisées conformément au RGPD.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement.</p>
    `,
    });
  }

  // Notification interne : envoyée à l'admin quand un client soumet un nouveau devis
  async sendNewQuoteAdminEmail(user, quote) {
    const clientName = escapeHtml(`${user.first_name} ${user.last_name}`);
    const quoteUrl = `${this._frontendUrl}/dashboard/quotes/${quote.id}`;
    await this._transporter.sendMail({
      from: this._from,
      to: this._adminEmail,
      subject: `[Nouveau devis] ${escapeHtml(quote.event_type)} — ${quote.event_date} (${quote.guest_count} invités)`,
      html: `
      <h1>Nouveau devis reçu</h1>
      <p>Un nouveau devis a été soumis par <strong>${clientName}</strong> (${escapeHtml(user.email)}).</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td><strong>Type d'événement :</strong></td><td>${escapeHtml(quote.event_type)}</td></tr>
        <tr><td><strong>Date :</strong></td><td>${quote.event_date}</td></tr>
        <tr><td><strong>Lieu :</strong></td><td>${escapeHtml(quote.event_address)}, ${escapeHtml(quote.event_city)}</td></tr>
        <tr><td><strong>Invités :</strong></td><td>${quote.guest_count}</td></tr>
        <tr><td><strong>Total estimé :</strong></td><td>${Number(quote.total).toFixed(2)} €</td></tr>
      </table>
      <p style="margin-top:16px">
        <a href="${quoteUrl}" style="background:#c8a75e;color:#0b0b0e;padding:10px 20px;border-radius:6px;text-decoration:none">
          Voir le devis
        </a>
      </p>
    `,
    });
  }

  async sendQuoteEmail(user, quote) {
    const name = escapeHtml(user.first_name);
    const lastName = escapeHtml(user.last_name || '');
    const quoteUrl = `${this._frontendUrl}/dashboard/quotes/${quote.id}`;

    const eventDate = new Date(quote.event_date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const validUntil = quote.valid_until
      ? new Date(quote.valid_until).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    const quoteRef = `DEV-${String(quote.id).substring(0, 8).toUpperCase()}`;

    const eventLabels = {
      mariage: 'Mariage', anniversaire: 'Anniversaire', seminaire: 'Séminaire',
      cocktail: 'Cocktail', gala: 'Gala', autre: 'Autre',
    };
    const eventLabel = eventLabels[quote.event_type] || escapeHtml(quote.event_type);

    // Lignes du devis
    const items = quote.items || [];
    const itemRows = items.map(item => {
      const label = escapeHtml(item.menu_title || item.label || 'Prestation');
      const unitLabel = item.unit === 'par_personne' ? 'par pers.' : 'unité';
      const qty = item.unit === 'par_personne' ? quote.guest_count : item.quantity;
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e8e0d0;color:#333">${label}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8e0d0;text-align:center;color:#555">${Number(item.unit_price).toFixed(2)} € / ${unitLabel}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8e0d0;text-align:center;color:#555">${qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8e0d0;text-align:right;font-weight:600;color:#0b0b0e">${Number(item.line_total).toFixed(2)} €</td>
        </tr>`;
    }).join('');

    const discountRow = Number(quote.discount_pct) > 0
      ? `<tr>
          <td colspan="3" style="padding:8px 12px;text-align:right;color:#555">Remise (${Number(quote.discount_pct).toFixed(0)}%)</td>
          <td style="padding:8px 12px;text-align:right;color:#c0392b;font-weight:600">- ${Number(quote.discount_amount).toFixed(2)} €</td>
        </tr>`
      : '';

    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: `Devis ${quoteRef} — ${eventLabel} du ${eventDate} — Vite & Gourmand`,
      html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:680px;margin:0 auto;background:#ffffff">

        <!-- En-tête -->
        <div style="background:#0b0b0e;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#c8a75e;font-size:28px;font-weight:700;letter-spacing:1px">Vite & Gourmand</h1>
          <p style="margin:6px 0 0;color:#a09880;font-size:13px;letter-spacing:2px;text-transform:uppercase">Traiteur d'exception</p>
        </div>

        <!-- Corps -->
        <div style="padding:36px 40px">

          <table style="width:100%;margin-bottom:28px">
            <tr>
              <td style="vertical-align:top">
                <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px">Devis</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#0b0b0e">${quoteRef}</p>
              </td>
              <td style="vertical-align:top;text-align:right">
                <p style="margin:0 0 4px;font-size:13px;color:#888">Valable jusqu'au</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:#0b0b0e">${validUntil}</p>
              </td>
            </tr>
          </table>

          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px">
            Bonjour ${name} ${lastName},<br/>
            Nous avons le plaisir de vous adresser le devis détaillé pour votre événement.
          </p>

          <!-- Infos événement -->
          <div style="background:#faf7f0;border-left:4px solid #c8a75e;padding:16px 20px;margin-bottom:28px;border-radius:0 8px 8px 0">
            <table style="width:100%">
              <tr>
                <td style="padding:4px 0;color:#555;font-size:14px;width:140px">Événement</td>
                <td style="padding:4px 0;color:#0b0b0e;font-weight:600;font-size:14px">${eventLabel}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#555;font-size:14px">Date</td>
                <td style="padding:4px 0;color:#0b0b0e;font-weight:600;font-size:14px">${eventDate}</td>
              </tr>
              ${quote.event_time ? `<tr>
                <td style="padding:4px 0;color:#555;font-size:14px">Heure</td>
                <td style="padding:4px 0;color:#0b0b0e;font-weight:600;font-size:14px">${quote.event_time}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:4px 0;color:#555;font-size:14px">Lieu</td>
                <td style="padding:4px 0;color:#0b0b0e;font-weight:600;font-size:14px">${escapeHtml(quote.event_address)}, ${escapeHtml(quote.event_city)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#555;font-size:14px">Convives</td>
                <td style="padding:4px 0;color:#0b0b0e;font-weight:600;font-size:14px">${quote.guest_count} personnes</td>
              </tr>
            </table>
          </div>

          <!-- Tableau des prestations -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
            <thead>
              <tr style="background:#0b0b0e">
                <th style="padding:12px;text-align:left;color:#c8a75e;font-size:13px;text-transform:uppercase;letter-spacing:1px">Prestation</th>
                <th style="padding:12px;text-align:center;color:#c8a75e;font-size:13px;text-transform:uppercase;letter-spacing:1px">Prix unit.</th>
                <th style="padding:12px;text-align:center;color:#c8a75e;font-size:13px;text-transform:uppercase;letter-spacing:1px">Qté</th>
                <th style="padding:12px;text-align:right;color:#c8a75e;font-size:13px;text-transform:uppercase;letter-spacing:1px">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows || '<tr><td colspan="4" style="padding:12px;color:#888;text-align:center">Aucune prestation détaillée</td></tr>'}
            </tbody>
          </table>

          <!-- Totaux -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
            <tbody>
              ${Number(quote.discount_pct) > 0 ? `
              <tr>
                <td colspan="3" style="padding:8px 12px;text-align:right;color:#555;font-size:14px">Sous-total</td>
                <td style="padding:8px 12px;text-align:right;color:#333;font-size:14px">${Number(quote.subtotal).toFixed(2)} €</td>
              </tr>` : ''}
              ${discountRow}
              <tr style="background:#0b0b0e">
                <td colspan="3" style="padding:14px 12px;text-align:right;color:#c8a75e;font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:1px">Total TTC</td>
                <td style="padding:14px 12px;text-align:right;color:#ffffff;font-weight:700;font-size:18px">${Number(quote.total).toFixed(2)} €</td>
              </tr>
              <tr>
                <td colspan="3" style="padding:10px 12px;text-align:right;color:#555;font-size:14px">Acompte à verser (30%)</td>
                <td style="padding:10px 12px;text-align:right;color:#c8a75e;font-weight:700;font-size:16px">${Number(quote.deposit_amount).toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>

          ${quote.dietary_notes ? `
          <div style="background:#fff8e7;border:1px solid #e8d9a0;padding:12px 16px;border-radius:8px;margin-bottom:24px">
            <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Notes alimentaires</p>
            <p style="margin:0;font-size:14px;color:#333">${escapeHtml(quote.dietary_notes)}</p>
          </div>` : ''}

          <!-- CTA -->
          <div style="text-align:center;margin:32px 0">
            <a href="${quoteUrl}" style="display:inline-block;background:#c8a75e;color:#0b0b0e;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px">
              Consulter et accepter mon devis
            </a>
          </div>

          <p style="font-size:13px;color:#888;text-align:center;margin:0 0 8px">
            Ce devis est valable jusqu'au <strong>${validUntil}</strong>. Passé ce délai, il sera automatiquement expiré.
          </p>
        </div>

        <!-- Pied de page -->
        <div style="background:#f6f1e7;padding:24px 40px;text-align:center;border-top:1px solid #e8e0d0">
          <p style="margin:0 0 4px;font-size:13px;color:#555">Vite &amp; Gourmand — Traiteur d'exception</p>
          <p style="margin:0;font-size:12px;color:#999">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
        </div>
      </div>
    `,
    });
  }

  // Email simple envoyé au client quand il accepte le devis.
  // Ne contient PAS les coordonnées bancaires : celles-ci sont envoyées
  // séparément par le staff via sendDepositInstructions() → sendQuoteAcceptedEmail().
  async sendQuoteConfirmedEmail(user, quote) {
    const name = escapeHtml(user.first_name);
    const quoteUrl = `${this._frontendUrl}/dashboard/quotes/${quote.id}`;
    const eventDate = new Date(quote.event_date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Devis accepté — Vite & Gourmand',
      html: `
        <h1>Devis accepté</h1>
        <p>Bonjour ${name},</p>
        <p>Merci pour votre confiance. Votre devis pour le <strong>${escapeHtml(eventDate)}</strong>
           (${escapeHtml(quote.event_type)}, ${quote.guest_count} invité(s)) a bien été enregistré.</p>
        <p>Notre équipe va vous faire parvenir les instructions de paiement de l'acompte
           de <strong>${Number(quote.deposit_amount || 0).toFixed(2)} €</strong>
           dans les meilleurs délais.</p>
        <p>
          <a href="${quoteUrl}"
             style="background:#c8a75e;color:#0b0b0e;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">
            Consulter mon devis
          </a>
        </p>
        <p>À très bientôt,<br/>L'équipe Vite &amp; Gourmand</p>
      `,
    });
  }

  // Email envoyé par le staff avec les coordonnées bancaires (instructions d'acompte).
  async sendQuoteAcceptedEmail(user, quote) {
    const name = escapeHtml(user.first_name);
    const depositAmount = Number(quote.deposit_amount || 0).toFixed(2);

    const hasBank = Boolean(this._bankIban && this._bankBic && this._bankAccountName);
    const hasOnSite = Boolean(this._onSiteAddress);

    const reference = `DEVIS ${quote.id.slice(0, 8).toUpperCase()}`;
    const quoteUrl = `${this._frontendUrl}/dashboard/quotes/${quote.id}`;

    const bankBlock = hasBank ? `
      <h3>Paiement par virement bancaire</h3>
      <p>Merci d'indiquer la référence suivante dans le libellé du virement :</p>
      <p><strong>${escapeHtml(reference)}</strong></p>
      <p>
        <strong>Titulaire :</strong> ${escapeHtml(this._bankAccountName)}<br/>
        <strong>IBAN :</strong> ${escapeHtml(this._bankIban)}<br/>
        <strong>BIC :</strong> ${escapeHtml(this._bankBic)}
      </p>
    ` : '';

    const onSiteBlock = hasOnSite ? `
      <h3>Paiement sur place</h3>
      <p>
        Vous pouvez également régler l'acompte directement sur place :<br/>
        <strong>Adresse :</strong> ${escapeHtml(this._onSiteAddress)}<br/>
        ${this._onSiteHours ? `<strong>Horaires :</strong> ${escapeHtml(this._onSiteHours)}<br/>` : ''}
        ${this._onSitePhone ? `<strong>Téléphone :</strong> ${escapeHtml(this._onSitePhone)}<br/>` : ''}
      </p>
    ` : '';

    const paymentIntro = (hasBank || hasOnSite)
      ? `<p>Pour confirmer votre réservation, merci de régler l'acompte de <strong>${depositAmount} €</strong>.</p>`
      : `<p>Pour confirmer votre réservation, notre équipe vous contactera prochainement pour les modalités de règlement de l'acompte de <strong>${depositAmount} €</strong>.</p>`;

    const eventDate = new Date(quote.event_date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: "Devis accepté — Paiement de l'acompte",
      html: `
        <h1>Devis accepté</h1>
        <p>Bonjour ${name},</p>
        <p>Merci pour votre confiance ! Votre devis pour le <strong>${escapeHtml(eventDate)}</strong> a été accepté.</p>

        ${paymentIntro}

        ${(hasBank || hasOnSite) ? `
          <div style="padding:14px;border:1px solid rgba(200,167,94,.35);border-radius:10px;background:#fff;">
            ${bankBlock}
            ${onSiteBlock}
          </div>
          <p><em>Votre devis sera confirmé dès réception de l'acompte.</em></p>
        ` : ''}

        <p>
          <a href="${quoteUrl}" style="background:#c8a75e;color:#0b0b0e;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">
            Consulter mon devis
          </a>
        </p>

        <p>À très bientôt,<br/>L'équipe Vite &amp; Gourmand</p>
      `,
    });
  }

  // Notification admin quand le CLIENT refuse un devis
  async sendQuoteRefusedEmail(quote) {
    await this._transporter.sendMail({
      from: this._from,
      to: this._adminEmail,
      subject: `[Devis refusé] ${quote.event_type} — ${quote.event_date}`,
      html: `
      <h1>Devis refusé par le client</h1>
      <p>Le client a refusé le devis #${quote.id.slice(0, 8)}
         (${escapeHtml(quote.event_type)}, ${quote.event_date}, ${quote.guest_count} invités).</p>
    `,
    });
  }

  // Notification client quand le STAFF refuse un devis
  async sendStaffRefusedQuoteEmail(user, quote) {
    const name = escapeHtml(user.first_name);
    const eventDate = new Date(quote.event_date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Votre demande de devis — Vite & Gourmand',
      html: `
        <h1>Suite à votre demande de devis</h1>
        <p>Bonjour ${name},</p>
        <p>Après examen de votre demande pour le <strong>${escapeHtml(eventDate)}</strong>
           (${escapeHtml(quote.event_type)}, ${quote.guest_count} invité(s)),
           nous ne sommes malheureusement pas en mesure de donner suite à ce devis.</p>
        <p>N'hésitez pas à nous recontacter pour toute autre demande ou pour reformuler votre projet.</p>
        <p>Cordialement,<br/>L'équipe Vite &amp; Gourmand</p>
      `,
    });
  }

  async sendDepositConfirmedEmail(user, quote) {
    const name = escapeHtml(user.first_name);
    const quoteUrl = `${this._frontendUrl}/dashboard/quotes/${quote.id}`;
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Acompte confirmé — Vite & Gourmand',
      html: `
      <h1>Acompte enregistré</h1>
      <p>Bonjour ${name},</p>
      <p>Votre acompte de <strong>${Number(quote.deposit_amount).toFixed(2)} €</strong>
         a bien été enregistré pour votre événement du <strong>${quote.event_date}</strong>.</p>
      <p>Votre réservation est confirmée. Nous préparerons votre commande dans les meilleurs délais.</p>
      <p><a href="${quoteUrl}">Consulter mon devis</a></p>
    `,
    });
  }

  async sendQuoteConvertedEmail(user, order) {
    const name = escapeHtml(user.first_name);
    const orderUrl = `${this._frontendUrl}/dashboard/orders/${order.id}`;
    const depositAmount = order.deposit_amount ? Number(order.deposit_amount).toFixed(2) : null;
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Votre commande a été créée — Vite & Gourmand',
      html: `
      <h1>Commande créée</h1>
      <p>Bonjour ${name},</p>
      <p>Suite à l'acceptation de votre devis, votre commande a été créée avec succès.</p>
      <p><strong>Référence commande :</strong> #${order.id.slice(0, 8)}</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td><strong>Total :</strong></td><td>${Number(order.total_price).toFixed(2)} €</td></tr>
        ${depositAmount ? `<tr><td><strong>Acompte (30%) :</strong></td><td>${depositAmount} €</td></tr>` : ''}
        <tr><td><strong>Mode de paiement :</strong></td><td>Virement bancaire ou sur place</td></tr>
      </table>
      ${depositAmount ? '<p><strong>Important :</strong> Un acompte est requis avant la mise en préparation de votre commande. Vous pouvez régler par virement ou sur place.</p>' : ''}
      <p><a href="${orderUrl}" style="background:#c8a75e;color:#0b0b0e;padding:10px 20px;border-radius:6px;text-decoration:none">
        Suivre ma commande
      </a></p>
    `,
    });
  }

  async sendDepositReceivedEmail(user, order) {
    const name = escapeHtml(user.first_name);
    const orderUrl = `${this._frontendUrl}/dashboard/orders/${order.id}`;
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: `Acompte reçu — Commande #${order.id.slice(0, 8)} — Vite & Gourmand`,
      html: `
      <h1>Acompte enregistré</h1>
      <p>Bonjour ${name},</p>
      <p>Nous confirmons la réception de votre acompte de <strong>${Number(order.deposit_amount).toFixed(2)} €</strong>
         pour la commande #${order.id.slice(0, 8)}.</p>
      <p>Votre commande peut maintenant être mise en préparation.</p>
      <p><a href="${orderUrl}">Suivre ma commande</a></p>
    `,
    });
  }

  async sendQuoteExpiredEmail(user, quote) {
    const name = escapeHtml(user.first_name);
    await this._transporter.sendMail({
      from: this._from,
      to: user.email,
      subject: 'Votre devis a expiré — Vite & Gourmand',
      html: `
      <h1>Devis expiré</h1>
      <p>Bonjour ${name},</p>
      <p>Votre devis pour le <strong>${quote.event_date}</strong> a expiré car il n'a pas été
         accepté dans les délais impartis.</p>
      <p>N'hésitez pas à faire une nouvelle demande sur notre site.</p>
      <p>À bientôt,<br>L'équipe Vite &amp; Gourmand</p>
    `,
    });
  }
}

module.exports = EmailService;
