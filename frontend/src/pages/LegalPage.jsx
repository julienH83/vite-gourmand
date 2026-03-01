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

## 1. Responsable du traitement
**Vite & Gourmand** — Traiteur événementiel à Bordeaux.
Adresse : 10 Place de la Bourse, 33000 Bordeaux
Email : contact@vitegourmand.fr

## 2. Données collectées
Dans le cadre de l'utilisation de notre site et de nos services, nous collectons les données suivantes :

- **Données d'identification** : prénom, nom, adresse email, numéro de téléphone
- **Données de livraison** : adresse de livraison
- **Données de commandes** : détail des prestations, date de livraison, montants
- **Données de connexion** : logs techniques (adresse IP, navigateur) à des fins de sécurité

## 3. Finalités du traitement
Vos données sont utilisées pour :

- La création et la gestion de votre compte client
- Le traitement de vos commandes et devis
- La communication relative à vos commandes (confirmation, suivi)
- La facturation et les obligations comptables légales
- La sécurité et la prévention des fraudes

## 4. Base légale
- **Exécution du contrat** : traitement des commandes et des devis
- **Obligation légale** : conservation des données de facturation (art. L.123-22 Code de commerce)
- **Intérêt légitime** : sécurité du site et prévention des fraudes
- **Consentement** : lors de l'inscription (case RGPD cochée)

## 5. Durée de conservation
- Données du compte actif : pendant toute la durée de la relation contractuelle
- Données de facturation : 10 ans (obligation légale)
- Données d'un compte supprimé : anonymisation immédiate des données personnelles ; les données de commandes sont conservées sous forme anonymisée pour nos obligations légales

## 6. Vos droits (RGPD)
Conformément au Règlement (UE) 2016/679, vous disposez des droits suivants :

- **Droit d'accès** (art. 15) : obtenir une copie de vos données
- **Droit de rectification** (art. 16) : corriger vos données inexactes
- **Droit à l'effacement** (art. 17) : demander la suppression de vos données
- **Droit à la portabilité** (art. 20) : exporter vos données dans un format lisible
- **Droit d'opposition** (art. 21) : vous opposer à certains traitements
- **Droit à la limitation** (art. 18) : suspendre temporairement un traitement

Ces droits sont directement accessibles depuis votre espace client (Mon profil > Mes droits RGPD).
Pour toute demande : **contact@vitegourmand.fr**

## 7. Destinataires des données
Vos données sont accessibles uniquement au personnel habilité de Vite & Gourmand et à nos sous-traitants techniques (hébergeur, service d'envoi d'emails), liés par des engagements de confidentialité conformes au RGPD.
Aucune donnée n'est cédée à des tiers à des fins commerciales.

## 8. Sécurité
Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données contre tout accès non autorisé, toute perte ou altération (chiffrement, hachage des mots de passe, HTTPS, contrôle des accès).

## 9. Cookies
Notre site utilise uniquement des cookies strictement nécessaires à son fonctionnement (session, authentification JWT). Aucun cookie publicitaire ou de tracking n'est déposé.

## 10. Réclamation
Si vous estimez que le traitement de vos données n'est pas conforme à la réglementation, vous pouvez introduire une réclamation auprès de la **CNIL** : www.cnil.fr`
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
            <li key={`${keyBase}-li-${idx}`}>{item}</li>
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

      nodes.push(<p key={i} className="legal-luxe__p">{line}</p>);
    });

    flushList('end');
    return nodes;
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
