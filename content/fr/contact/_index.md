---
title: "Contact"
description: "Contactez SAR France"
layout: "contact"
type: "contact"
lastUpdate: 2026-03-01
---

### Sommaire de la page

- [Secrétariat](#secretariat) – Adresse, permanences et coordonnées
- [Siège NSSAR](#siege-nssar) – National Society SAR à Louisville
- [Formulaire de contact](#formulaire-de-contact) – Nous écrire en ligne

<div class="contact-top">
<div>

## Secrétariat {#secretariat}

**Adresse** : {{< address >}}  
**Permanences** : le mardi et le jeudi de 09h30 à 18h00  
**Courriel** : {{< contact "email" >}}  
**Téléphone** : {{< contact "phone" >}}

</div>
<div>

## Localisation

<div id="map-paris" class="contact-map" data-popup="Secrétariat SAR France<br>20 rue Bosquet, 75007 Paris" aria-label="Localisation du secrétariat SAR France, 20 rue Bosquet, 75007 Paris"></div>

</div>
</div>

<div class="contact-top">
<div>

## Siège NSSAR {#siege-nssar}

SAR France est affiliée à la National Society Sons of the American Revolution (NSSAR), dont le siège est à Louisville, Kentucky, États-Unis.

**Adresse** : 809 West Main Street, Louisville, KY 40202, USA  
**Site** : [www.sar.org](https://www.sar.org)

</div>
<div>

## Localisation

<div id="map-louisville" class="contact-map" data-popup="Siège NSSAR<br>809 W Main St, Louisville, KY 40202" aria-label="Siège NSSAR, 809 West Main Street, Louisville, Kentucky"></div>

</div>
</div>

## Formulaire de contact {#formulaire-de-contact}

<form class="contact-form" action="https://api.web3forms.com/submit" method="POST">
  <input type="hidden" name="access_key" value="29cee0a1-6737-4155-bfb6-4b80d4e2f687">
  <input type="hidden" name="subject" value="Nouveau message depuis sarfrance.org">
  <div class="form-row">
    <div class="form-group">
      <label for="nom">Nom <span class="required" aria-hidden="true">*</span></label>
      <input type="text" id="nom" name="nom" placeholder="Votre nom" required>
    </div>
    <div class="form-group">
      <label for="prenom">Prénom <span class="required" aria-hidden="true">*</span></label>
      <input type="text" id="prenom" name="prenom" placeholder="Votre prénom" required>
    </div>
  </div>
  <div class="form-group">
    <label for="email">Adresse courriel <span class="required" aria-hidden="true">*</span></label>
    <input type="email" id="email" name="email" placeholder="votre@courriel.fr" required>
  </div>
  <div class="form-group">
    <label for="objet">Objet <span class="required" aria-hidden="true">*</span></label>
    <select id="objet" name="objet" required>
      <option value="" disabled selected>Choisissez un objet</option>
      <option value="information">Demande d'information</option>
      <option value="adhesion">Adhésion</option>
      <option value="activites">Participation aux activités</option>
      <option value="genealogie">Recherche généalogique</option>
      <option value="autre">Autre</option>
    </select>
  </div>
  <div class="form-group">
    <label for="message">Message <span class="required" aria-hidden="true">*</span></label>
    <textarea id="message" name="message" rows="6" placeholder="Votre message…" required></textarea>
  </div>
  <p class="form-note">Les champs marqués d'un <span class="required">*</span> sont obligatoires.</p>
  <button type="submit" class="btn btn-primary form-submit">Envoyer</button>
</form>
