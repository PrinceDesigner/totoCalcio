import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { COLORJS } from '../../theme/themeColor';

const faqData = [

  {
    domanda: "Come posso creare o unirmi a una lega?",
    risposta: "Dopo aver creato il tuo profilo, puoi creare una lega o unirti a una lega esistente. Per creare una lega, vai alla sezione 'Crea Lega', inserisci un nome e invita i tuoi amici. Per unirti a una lega esistente, inserisci il codice invito ricevuto dall'amministratore della lega. Cliccando il tasto 'Unisciti alla Lega'"
  },
  {
    domanda: "Come posso invitare amici alla mia lega?",
    risposta: "Per invitare amici, vai alla tua lega e clicca sull'icona Per condividere il codice della lega. Il tuo amico dovrà inserire il codice nella sezione unisciti alla lega"
  },
  {
    domanda: "Come funzionano le predizioni?",
    risposta: "Prima dell'inizio di ogni giornata di Serie A, puoi inserire le tue predizioni (1x2) per ogni partita. Potrai vedere un countdown nella pagina della lega per ricordarti la scadenza."
  },
  {
    domanda: "Quando posso inserire le mie predizioni?",
    risposta: "Puoi inserire le tue predizioni fino alla scadenza della countdown. Dopo l'inizio della giornata, non sarà più possibile modificare le tue predizioni."
  },
  {
    domanda: "Come viene aggiornata la classifica della lega?",
    risposta: "Al termine della giornata, l'amministratore calcola i risultati delle predizioni e la classifica viene aggiornata automaticamente. Puoi vedere la classifica nella sezione 'Classifica' all'interno della tua lega."
  },
  {
    domanda: "Come posso diventare amministratore di una lega?",
    risposta: "Solo un amministratore esistente può assegnare i permessi di amministrazione ad un altro membro della lega. Per fare questo, l'amministratore può accedere alla lista dei membri e selezionare chi vuole nominare come amministratore. Dopo aver cliccato su di esso e andare sul suo profilo"
  },
  {
    domanda: "Posso cambiare la mia immagine o il nome del profilo?",
    risposta: "Sì, puoi modificare la tua immagine e il tuo nome del profilo andando nella sezione 'Profilo'. Da lì, puoi caricare una nuova immagine e cambiare il tuo nome."
  },
  {
    domanda: "Cosa succede se dimentico di inserire le predizioni?",
    risposta: "Se dimentichi di inserire le tue predizioni entro il limite di tempo, non riceverai punti per quella giornata. Riceverai comunque una notifica prima della scadenza per ricordarti di inserirle."
  },
  {
    domanda: "Posso cambiare le mie predizioni dopo averle inserite?",
    risposta: "Puoi modificare le tue predizioni fino alla scadenza della giornata, indicata dal countdown. Dopo la scadenza, le predizioni inserite saranno definitive."
  },
  {
    domanda: "Come posso vedere i risultati delle predizioni degli altri membri?",
    risposta: "Dopo l'inizio della giornata, puoi vedere le predizioni di tutti i membri della tua lega nella sezione 'Guarda esiti'."
  },
  {
    domanda: "Posso partecipare a più leghe contemporaneamente?",
    risposta: "Sì, puoi partecipare a più leghe contemporaneamente. Basta usare i codici invito o creare nuove leghe. Puoi gestire tutte le tue leghe dalla sezione 'Le Mie Leghe'."
  },
  {
    domanda: "Cosa devo fare se ho problemi con l'app?",
    risposta: "Se hai problemi tecnici o altre domande non presenti in questa lista, puoi contattare il nostro supporto nella sezione 'Aiuto & Supporto' dell'app."
  },
  {
    domanda: "Come vengono assegnati i punti per le predizioni corrette?",
    risposta: "I punti vengono assegnati in base alla correttezza delle tue predizioni. Ogni predizione corretta è 1 punto"
  },
  {
    domanda: "Come posso rimuovere un membro dalla lega?",
    risposta: "Solo gli amministratori possono rimuovere un membro dalla lega. Vai nella sezione dei membri, seleziona il membro che desideri rimuovere e clicca sull'icona del cestino."
  }
]


const TutorialAccordion = () => {
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {faqData.map((item, index) => (
          <AccordionItem key={index} domanda={item.domanda} risposta={item.risposta} />
        ))}
      </View>
    </ScrollView>
  );
};

const AccordionItem = ({ domanda, risposta }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleExpanded = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity onPress={toggleExpanded} style={styles.header}>
        <Text style={styles.headerText}>{domanda}</Text>
      </TouchableOpacity>
      <Collapsible collapsed={isCollapsed}>
        <View style={styles.content}>
          <Text style={styles.contentText}>{risposta}</Text>
        </View>
      </Collapsible>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  accordionContainer: {
    marginBottom: 10,
    backgroundColor: '#141414',
    borderRadius: 5,
  },
  header: {
    backgroundColor: COLORJS.secondaryBackGroud,
    padding: 15,
    borderRadius: 5,
  },
  headerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    padding: 20,
    backgroundColor: '#000000',
    borderRadius: 5,
    marginTop: 10,
  },
  contentText: {
    color: '#f1c40f',
  },
});

export default TutorialAccordion;