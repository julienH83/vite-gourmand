import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function LegalPage() {
  const { type } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Contenu fallback si l’API n’a pas encore la page
  const fallbackPages = useMemo(() => {
    const today = new Date().toISOString();
    return {
      "confidentialite": {
        title: 'Politique de confidentialité',
        updated_at: today,
        content: `# Politique de confidentialité

**Dernière mise à jour : mars 2026**

La société Vite & Gourmand, en sa qualité de responsable de traitement, attache une importance particulière à la protection des données personnelles de ses clients et visiteurs. La présente politique vise à vous informer sur la manière dont nous recueillons et traitons vos données, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée.

## 1. Identité du responsable de traitement
Vite & Gourmand — Traiteur événementiel
Julie et José, co-gérants
10 Place de la Bourse, 33000 Bordeaux
Tél. : 05 56 00 00 00 — Email : contact@vitegourmand.fr

## 2. Données collectées
Nous collectons uniquement les données nécessaires à la bonne exécution de nos prestations : nom, prénom, email, téléphone, adresse postale et mot de passe (chiffré) lors de la création de compte ; menu, nombre de convives, adresse et date de livraison lors d'une commande ; objet, email et contenu lors d'une prise de contact. Des données techniques (adresse IP, navigateur) sont collectées à des fins de sécurité.

## 3. Pourquoi nous utilisons vos données
- Gérer votre espace client et traiter vos commandes
- Établir et suivre vos demandes de devis
- Vous adresser les emails liés à vos commandes
- Modérer et publier les avis déposés après prestation
- Répondre à vos messages et assurer la sécurité du site
- Respecter nos obligations comptables et fiscales

## 4. Base juridique
Exécution du contrat (commandes, devis), consentement (inscription), obligation légale (données comptables — 10 ans), intérêt légitime (sécurité, prévention de la fraude).

## 5. Durée de conservation
Compte actif : durée de la relation. Compte inactif 3 ans : vérification auprès du client. Facturation : 10 ans. Compte supprimé : anonymisation immédiate. Messages de contact : 2 ans.

## 6. Vos droits
Accès, rectification, effacement, limitation, portabilité, opposition, retrait du consentement — exercez-les depuis votre espace client ou par email à contact@vitegourmand.fr (réponse sous 30 jours).

## 7. Cookies
Cookies strictement nécessaires uniquement (session, authentification). Aucun cookie publicitaire ou de suivi.

## 8. Réclamation
CNIL : www.cnil.fr — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07`
      },
      "mentions_legales": {
        title: 'Mentions légales',
        updated_at: today,
        content: `# Mentions légales

## 1. Éditeur du site
**Vite & Gourmand** — Traiteur événementiel à Bordeaux.  
Adresse : 10 Place de la Bourse, 33000 Bordeaux  
Téléphone : 05 56 00 00 00  
Email : contact@vitegourmand.fr  

## 2. Hébergement
Hébergeur : **[à compléter]**  
Adresse : **[à compléter]**  
Téléphone : **[à compléter]**  
Site : **[à compléter]**

## 3. Propriété intellectuelle
L’ensemble des contenus présents sur le site (textes, images, photographies, logos, éléments graphiques, structure) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification ou diffusion sans autorisation préalable est interdite.

## 4. Données personnelles (RGPD)
Les données personnelles collectées via le site (formulaire de contact, compte client, commandes) sont utilisées uniquement pour le traitement des demandes, la gestion des commandes et la relation client.

- Responsable du traitement : Vite & Gourmand
- Finalités : demandes, devis, commandes, facturation, support
- Base légale : exécution du contrat / intérêt légitime / consentement (selon le cas)
- Durée de conservation : [à compléter]
- Destinataires : personnel habilité + prestataires techniques (hébergement, emails)

Conformément à la réglementation, vous disposez d’un droit d’accès, de rectification, d’opposition, d’effacement, de limitation et de portabilité.  
Pour exercer vos droits : **contact@vitegourmand.fr**

## 5. Cookies
Le site peut utiliser des cookies nécessaires à son bon fonctionnement (session, authentification). Les cookies de mesure d’audience ou publicitaires ne sont déposés qu’avec votre consentement, le cas échéant.

## 6. Responsabilité
Vite & Gourmand met tout en œuvre pour assurer l’exactitude des informations publiées. Toutefois, des erreurs ou omissions peuvent survenir. L’utilisateur est invité à vérifier les informations et à signaler toute anomalie.

## 7. Droit applicable
Les présentes mentions légales sont soumises au droit français. En cas de litige, et à défaut de solution amiable, les tribunaux compétents seront ceux du ressort du siège social de l’éditeur, sauf disposition légale impérative contraire.`
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLegal = async () => {
      setLoading(true);
      try {
        const r = await api.get(`/legal/${type}`);

        // API erreur => fallback
        if (!r.ok) {
          const fallback = fallbackPages[type];
          if (isMounted) setPage(fallback || null);
          return;
        }

        // Réponse vide => fallback
        const text = await r.text();
        if (!text) {
          const fallback = fallbackPages[type];
          if (isMounted) setPage(fallback || null);
          return;
        }

        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }

        // JSON invalide => fallback
        if (!data || !data.content) {
          const fallback = fallbackPages[type];
          if (isMounted) setPage(fallback || null);
          return;
        }

        if (isMounted) setPage(data);
      } catch {
        const fallback = fallbackPages[type];
        if (isMounted) setPage(fallback || null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLegal();
    return () => {
      isMounted = false;
    };
  }, [type, fallbackPages]);

  const pageTitle = page?.title || 'Informations légales';

  const updatedLabel = useMemo(() => {
    const raw = page?.updated_at;
    const d = raw ? new Date(raw) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR') : null;
  }, [page?.updated_at]);

  // Rendu markdown simple
  const renderContent = (content) => {
    const lines = String(content || '').split('\n');

    const nodes = [];
    let listBuffer = [];

    const flushList = (keyBase) => {
      if (listBuffer.length === 0) return;
      nodes.push(
        <ul key={`${keyBase}-ul`} className="legal-luxe__list">
          {listBuffer.map((item, idx) => (
            <li key={`${keyBase}-li-${idx}`}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('- ')) {
        listBuffer.push(trimmed.slice(2));
        return;
      }

      flushList(i);

      if (trimmed.startsWith('# ')) {
        nodes.push(<h1 key={i} className="legal-luxe__h1">{trimmed.slice(2)}</h1>);
        return;
      }
      if (trimmed.startsWith('## ')) {
        nodes.push(<h2 key={i} className="legal-luxe__h2">{trimmed.slice(3)}</h2>);
        return;
      }
      if (trimmed.startsWith('### ')) {
        nodes.push(<h3 key={i} className="legal-luxe__h3">{trimmed.slice(4)}</h3>);
        return;
      }

      if (trimmed === '') {
        nodes.push(<div key={i} style={{ height: 10 }} />);
        return;
      }

      if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length >= 4) {
        nodes.push(
          <p key={i} className="legal-luxe__p">
            <strong>{trimmed.slice(2, -2)}</strong>
          </p>
        );
        return;
      }

      nodes.push(<p key={i} className="legal-luxe__p">{renderInline(line)}</p>);
    });

    flushList('end');
    return nodes;
  };

  // Gère le **gras** en milieu de texte
  const renderInline = (text) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  if (loading) return <div className="loading">Chargement...</div>;

  if (!page) {
    return (
      <div className="container legal-luxe" style={{ maxWidth: 900 }}>
        <div className="legal-luxe__header">
          <Link to="/" className="legal-luxe__back">← Retour à l’accueil</Link>
          <h1 className="legal-luxe__title">Page non trouvée</h1>
          <div className="legal-luxe__meta">
            <span>Vite &amp; Gourmand</span>
            <span className="legal-luxe__dot">·</span>
            <span>Traiteur événementiel</span>
            <span className="legal-luxe__dot">·</span>
            <span>Bordeaux</span>
          </div>
        </div>

        <article className="legal-luxe__card">
          <p className="legal-luxe__p">
            Cette page n’existe pas ou son contenu n’est pas encore disponible.
          </p>
        </article>
      </div>
    );
  }

  return (
    <div className="container legal-luxe" style={{ maxWidth: 900 }}>
      <div className="legal-luxe__header">
        <Link to="/" className="legal-luxe__back">← Retour à l’accueil</Link>

        <h1 className="legal-luxe__title">{pageTitle}</h1>

        <div className="legal-luxe__meta">
          <span>Vite &amp; Gourmand</span>
          <span className="legal-luxe__dot">·</span>
          <span>Traiteur événementiel</span>
          <span className="legal-luxe__dot">·</span>
          <span>Bordeaux</span>
        </div>
      </div>

      <article className="legal-luxe__card">
        <div className="legal-luxe__content">{renderContent(page.content)}</div>

        {updatedLabel && (
          <p className="legal-luxe__update">
            Dernière mise à jour : {updatedLabel}
          </p>
        )}
      </article>
    </div>
  );
}
