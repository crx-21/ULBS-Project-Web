# ULBS-Project-Web
Project 2026 Web Programming.

BA: Termen limita MVP 05.06.2026 ora 12:00


Task-uri:

BA:
- [ ] Register sau LogIn button
- [ ] Posibilitatea sa alegi, dupa ce user-ul s-a inregistrat, ce tip de user esti.
      
- [ ]  Exemplu: proprietar sau chirias. Daca alege proprietar, sa fie o pagina dedicata in care sa fie urmatoarele lucruri:
- [ ]  Tip Entitate: Dropdown / Radio button cu două opțiuni: Persoană Fizică sau Persoană Juridică (Firmă/Agenție).
- [ ]   CUI / CIF (Doar dacă alege Persoană Juridică):
- [ ]   Câmp text pentru codul de identificare fiscală.
- [ ]   Nume Companie (Doar dacă alege Persoană Juridică): Câmp text, Cont IBAN: Câmp obligatoriu pentru a putea retrage sau încasa banii din platformă.
- [ ] Trebuie validat formatul standard IBAN.
- [ ] Acceptare Termeni și Condiții: Checkbox obligatoriu.
- [ ] Acord GDPR pentru prelucrarea datelor: Checkbox obligatoriu (mai ales datorită colectării datelor financiare și a numerelor de telefon).
      
- [ ] Exemplu chirias:
- [ ] Încărcare Act de Identitate (Buletin): Câmp obligatoriu (Tip: File Upload - .jpg, .png, .pdf).
- [ ] CNP (Cod Numeric Personal): Câmp obligatoriu. Validare de lungime (13 caractere) și format (doar cifre).
- [ ] Serie și Număr Act de Identitate: Câmp obligatoriu (ex: Serie: 2 litere, Număr: 6 cifre).
- [ ]  Adresă de Domiciliu (din buletin): Câmp obligatoriu (Județ, Localitate, Stradă, Număr) pentru a fi preluată automat în datele de facturare.
- [ ]  Adresă de Facturare: Câmp text sau formular detaliat (Județ, Oraș, Adresă completă) pentru emiterea corectă a facturilor către chiriași.
- [ ]  Date Card Bancar: Nu se stochează direct în baza de date a aplicației (pentru a evita problemele de securitate PCI-DSS).
- [ ]  Asta e optionala momentan: Dezvoltatorii trebuie să integreze formularul unui procesator de plăți (ex: Stripe, Netopia).
- [ ]  Tokenizare: Salvarea unui payment_method_id (token) returnat de procesatorul de plăți pentru a permite plățile recurente (chiria lunară).


!!Dupa fiecare inregistrare realizata cu succes, user-ul trebuie sa primeasca un mail prin care sa-i arate: tipul de inregistrare (chirias/proprietar), nume, prenume, nr de telefon si un mesaj de Multumim ca ne-ati ales. Va v-om asigura cea mai frumoasa experienta.
      
- [ ] Meniul proprietarului
      1. Secțiunea: Informații GeneraleTitlu
- [ ] Anunț: Câmp text cu limită minimă (ex: 15 caractere) și limită maximă de 60 de caractere. Frontend-ul trebuie să afișeze un contor de caractere (ex: 45/60).
- [ ] Filtru de conținut (Titlu & Descriere): Backend-ul trebuie să valideze input-ul printr-un filtru (Regex sau librărie de "profanity filter") pentru a bloca cuvinte obscene, spam (ex: "!!!!!!!") sau injurii, dând voie proprietarului să scrie liber, dar în limite decente.
- [ ] Descriere Detaliată: Câmp de tip Textarea mare, fără limită restrictivă de caractere, unde proprietarul poate scrie povestea și detaliile apartamentului.
      2. Secțiunea: Caracteristici Specifice (Filtre)
- [ ] Preț: Câmp numeric (selectare monedă: EUR / RON).
- [ ] Suprafață: Câmp numeric (în metri pătrați - mp).
- [ ] Zonă / Cartier: Câmp de tip Autocomplete / Dropdown cu zonele orașului (sau Google Maps API).
- [ ] Etaj: Dropdown (ex: Parter, 1, 2, ..., Mansardă).
- [ ] Anul Construcției: Câmp numeric (ex: dropdown cu anii sau intervale).
- [ ] Confort: Dropdown (1, 2, 3, Lux).
- [ ] Status curent: Dropdown / Radio buttons cu 3 opțiuni (Liber, În curând liber, Ocupat).
- [ ] Bifă de reducere: Checkbox "Aplică reducere" care va deschide un câmp adițional pentru a introduce procentul (%) sau noul preț, pentru ca anunțul să fie marcat vizual corespunzător în prima pagină.
      3. Secțiunea: Media (Imagini)
- [ ] Upload Poze: Zonă de drag & drop sau buton de upload care permite selectarea de poze multiple simultan (maxim 10-15 poze).
- [ ]  Previzualizare și Thumbnail: După upload, pozele trebuie să aibă un preview vizual. Utilizatorul trebuie să poată selecta/muta o anumită poză pentru a fi "Thumbnail" (poza principală a anunțului, cea care apare prima în linia de 4).
      4. Secțiunea: Date de Contact Anunț
- [ ]  Poza de Profil: Preîncărcată automat (Read-only) din datele contului de proprietar.
- [ ]  Număr de Telefon: Precompletat automat cu cel din profil, dar câmpul trebuie să fie editabil, pentru a oferi posibilitatea proprietarului să pună un alt număr de contact specific doar pentru acest apartament (ex: numărul administratorului clădirii).
      Acțiuni Post-Submit:
- [ ] La apăsarea butonului "Publică Apartament", platforma afișează un loader (stare de încărcare).
- [ ] Dacă salvarea în baza de date are succes, utilizatorul primește un mesaj de succes de tip Toast/Snackbar: "Apartamentul a fost adăugat cu succes!" și este redirecționat către pagina de vizualizare a apartamentului proaspăt creat sau înapoi în lista de apartamente din dashboard.

      
- [ ] Apartamentele vor fi afisate 4 cate 4. Exemplu: prima linie sunt 4 apartamente, a 2-a linie 4 apartamente si tot asa.
- [ ] Vreau sa iasa in evidenta cele care urmeaza sa fie libere si cele la reducere. Cele la reducere trebuie sa se vada anuntul cu portocapiu sau o culoare ca scoate in evidenta ca este la reducere.
- [ ] Cand dai click pe un apartament (din punctul de vedere al propietarului)
      Pre-condiții (Securitate și Autorizare):
- [ ] Sistemul trebuie să valideze că utilizatorul autentificat care accesează ruta are rolul de Proprietar
- [ ] Verificare de proprietate (Ownership Check): Backend-ul trebuie să se asigure că apartamentul accesat (prin ID) aparține efectiv proprietarului logat (ex: apartment.owner_id == user.id). În caz contrar, se va returna eroarea 403 Forbidden.
      Criterii de Acceptanță (Structura Interfeței și Date):
- [ ] 1. Zona de Sumar Financiar (KPI Cards)
- [ ] În partea superioară a detaliilor apartamentului, UI-ul trebuie să afișeze 3 "carduri" de sumar (metrice agregate) pentru citire rapidă:
- [ ] Card 1 - Total Facturi Emise: Afișează numărul absolut de facturi generate pentru acest apartament (ex: 24 Facturi).
- [ ] Card 2 - Plăți Efectuate (Succes): Afișează numărul de facturi care au statusul plătit integral (ex: 22 Plăți finalizate).
- [ ] Card 3 - Rest de Plată (Balanță Restantă): Afișează suma totală cumulată din facturile neplătite sau parțial plătite (ex: 450 EUR sau 0 EUR dacă totul este achitat). Textul/Cardul ar trebui să fie evidențiat cu roșu dacă există o sumă restantă.
      2. Tabelul cu Istoricul Facturilor și Plăților. Sub zona de sumar, proprietarul trebuie să aibă acces la lista detaliată care justifică metricele de mai sus.
- [ ] Tabelul va conține următoarele coloane obligatorii: Serie/ID Factură, Nume Chiriaș, Data Emiterii, Data Scadenței, Suma, și Status.
- [ ] Statusuri Vizuale (Badges): Implementarea unor etichete colorate pentru coloana de status:

🟢 Plătit (Verde) - Plata a fost confirmată.

🟡 În așteptare (Galben) - Factura a fost emisă, dar scadența nu a fost depășită.

🔴 Restanță (Roșu) - Data scadenței a fost depășită și plata nu a fost înregistrată.

  3. Funcționalități Adiționale în Tabel
- [ ] Sistem de Sortare: Click pe capul de tabel (ex: pe "Data Emiterii") pentru a ordona cronologic (ascendent/descendent).
- [ ] Acțiune Descarcă: Pentru fiecare rând din tabel, trebuie să existe un buton/iconiță de acțiune pentru descărcarea facturii în format .pdf.
- [ ] 
- [ ] Partea de facturi trebuie sa fie o pagina dedicata
      Pre-condiții (Acces):
- [ ] Meniul "Financiar / Facturi" este accesibil doar utilizatorilor logați cu rolul de Proprietar sau Agent.
- [ ] Datele afișate trebuie să fie strict restricționate la apartamentele (și facturile aferente) deținute de user_id-ul curent.

  Criterii de Acceptanță:

- [ ]1. Zona de Sumar (Global KPI Cards)
- [ ]Sus, în dashboard, trebuie să existe carduri care să calculeze și să afișeze automat totalurile generale (pe luna în curs sau pe anul curent, în funcție de un filtru global de dată):
- [ ]Venit Brut Total: Suma tuturor facturilor cu statusul Plătit.
- [ ]Total Taxe și Impozite: Un calcul automat aplicat la Venitul Brut (ex: dacă se aplică un impozit pe venit de 10%, sistemul va afișa valoarea reținută sau care trebuie plătită la stat). Atenție Devs: Procentajul de taxare trebuie să fie configurabil, nu hardcodat.
- [ ]Venit Net: Venit Brut minus Total Taxe.
- [ ]Total de Încasat (Restanțe): Suma cumulată a tuturor facturilor cu status În așteptare și Restanță de la toate apartamentele.

2. Modulul de Raportare Vizuală (Grafice)
- [ ]Secțiunea de mijloc a ecranului va conține diagrame pentru a vizualiza evoluția și starea afacerii:
- [ ]Graficul Veniturilor (Bar Chart sau Line Chart): O diagramă care afișează evoluția veniturilor încasate pe axa timpului (ex: Lunile anului pe axa X, Sumele în EUR/RON pe axa Y).
- [ ]Graficul Statusului Plăților (Pie Chart / Doughnut): O diagramă circulară care arată ponderea facturilor: % Plătite, % Neplătite, % Întârziate.

3. Tabelul Centralizat de Facturi (Toate Apartamentele)
În partea de jos a ecranului, va exista un tabel master cu absolut toate facturile emise de proprietar.
- [ ]Coloane obligatorii: ID Factură, Apartament (cu link către pagina apartamentului), Nume Chiriaș, Dată Emitere, Scadență, Sumă, Taxă calculată, Status.
- [ ]Filtre Globale pentru tabel:
- [ ]Filtru de selecție a unei perioade (Date Picker: De la... Până la...).
- [ ]Dropdown cu selecția apartamentului (arată-mi doar facturile pentru "Apartament X").
- [ ]Filtru după Status (arată-mi doar restanțele).
- [ ]Export Date: Buton de "Export to CSV/Excel" pentru lista de facturi curentă din tabel (foarte util pentru contabilitate).
  
- [ ] Agentul/proprietarul sa primeasca mail de fiecare data cand se face o plata (notificare)
- [ ] User-ul (cumparatorul) trebuie, in momentul cand se inregistreaza si vrea sa cumpere/inchirieze un apartament, sa aiba posibilitatea sa isi bage buletinul ca sa se poata sa se faca platile/facturile facute automat

Developer
- [ ] Interfata site (Pagina principala)
- [ ] Implementarea paginilor externe (Cont, For-Rent/To-Rent, Contact)
- [x] Creearea bazei de date
- [x] Functionalitatea contului
- [ ] Functionalitatea site-ului
- [ ] Legatura dintre back-end si front-end
- [ ] Implementarea design-ului

Designer:
- [x] Paleta de culori pentru site
- [x] Logo-ul
- [x] Design pagina principala
- [x] Design Sign-In/Log In
- [x] Design pagini externe (Cont, For-Rent/To-Rent, Contact)
- [ ] Animarea paginilor

Tester:
- [ ] 

