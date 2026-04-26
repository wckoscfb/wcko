import type { Lang } from './types';

/**
 * UI strings, keyed by a snake-case identifier. Each value maps every
 * supported `Lang` to its translation. English is the source of truth — if a
 * key is missing in another language, the runtime falls back to English (see
 * `useT` in ./context.tsx).
 *
 * Conventions:
 *  - Keep keys descriptive, scoped by area (footer.*, topbar.*, round.*, ...).
 *  - Use {placeholder} syntax for runtime substitutions; `useT` interpolates.
 *  - Keep punctuation IN the translation (it differs per language).
 */
export const STRINGS = {
  // ── Top bar ────────────────────────────────────────────────────────────
  'topbar.team_placeholder':         { en: 'Pick your team',           es: 'Elige tu equipo',         fr: 'Choisissez votre équipe', pt: 'Escolha a sua equipa' },
  'topbar.auto_estimate':            { en: 'Auto-estimate odds',       es: 'Estimar odds auto.',      fr: 'Estimer les cotes auto.', pt: 'Estimar odds auto.' },
  'topbar.auto_estimate_title':      { en: 'When ON, empty matches use Bradley-Terry from team strength. When OFF, empty matches default to 50/50.', es: 'Cuando está activado, los partidos vacíos usan Bradley-Terry según la fuerza del equipo. Cuando está desactivado, los partidos vacíos usan 50/50 por defecto.', fr: 'Activé, les matchs vides utilisent Bradley-Terry sur la force des équipes. Désactivé, ils sont à 50/50 par défaut.', pt: 'Ativado, os jogos vazios usam Bradley-Terry da força das equipas. Desativado, os jogos vazios usam 50/50 por defeito.' },
  'topbar.share':                    { en: 'Share',                    es: 'Compartir',               fr: 'Partager',                pt: 'Partilhar' },
  'topbar.share_copied':             { en: 'Link copied!',             es: '¡Enlace copiado!',        fr: 'Lien copié !',            pt: 'Link copiado!' },
  'topbar.share_title':              { en: 'My WCKO scenario',         es: 'Mi escenario WCKO',       fr: 'Mon scénario WCKO',       pt: 'O meu cenário WCKO' },
  'topbar.share_copy_prompt':        { en: 'Copy this link:',          es: 'Copia este enlace:',      fr: 'Copiez ce lien :',        pt: 'Copie este link:' },
  'topbar.back_home':                { en: 'Back to home',             es: 'Volver al inicio',        fr: 'Retour à l\'accueil',     pt: 'Voltar ao início' },
  'topbar.back_home_aria':           { en: 'WCKO — back to home',      es: 'WCKO — volver al inicio', fr: 'WCKO — retour à l\'accueil', pt: 'WCKO — voltar ao início' },
  'topbar.scenario_placeholder':     { en: 'Scenario name…',           es: 'Nombre del escenario…',   fr: 'Nom du scénario…',        pt: 'Nome do cenário…' },
  'topbar.save':                     { en: 'Save',                     es: 'Guardar',                 fr: 'Sauvegarder',             pt: 'Guardar' },
  'topbar.load':                     { en: 'Load…',                    es: 'Cargar…',                 fr: 'Charger…',                pt: 'Carregar…' },
  'topbar.delete':                   { en: 'Delete',                   es: 'Eliminar',                fr: 'Supprimer',               pt: 'Eliminar' },
  'topbar.reset':                    { en: 'Reset',                    es: 'Reiniciar',               fr: 'Réinitialiser',           pt: 'Reiniciar' },
  'topbar.reset_confirm':            { en: 'Clear the entire scenario?', es: '¿Borrar todo el escenario?', fr: 'Effacer tout le scénario ?', pt: 'Limpar todo o cenário?' },

  // ── Group finish picker ────────────────────────────────────────────────
  'finish.first':                    { en: '1st',                      es: '1°',                      fr: '1er',                     pt: '1º' },
  'finish.second':                   { en: '2nd',                      es: '2°',                      fr: '2e',                      pt: '2º' },
  'finish.third':                    { en: '3rd',                      es: '3°',                      fr: '3e',                      pt: '3º' },
  'finish.tooltip':                  { en: 'Pick how your team finishes the group',  es: 'Elige cómo tu equipo termina el grupo', fr: 'Choisissez la position de votre équipe dans le groupe', pt: 'Escolha como a sua equipa termina o grupo' },
  'finish.prompt':                   { en: 'Pick a group finish (1° / 2° / 3°) to begin.', es: 'Elige una posición en el grupo (1° / 2° / 3°) para empezar.', fr: 'Choisissez une position dans le groupe (1° / 2° / 3°) pour commencer.', pt: 'Escolha uma posição no grupo (1° / 2° / 3°) para começar.' },

  // ── Round labels ───────────────────────────────────────────────────────
  'round.R32':                       { en: 'Round of 32',              es: 'Dieciseisavos',           fr: 'Seizièmes de finale',     pt: '16-avos de final' },
  'round.R16':                       { en: 'Round of 16',              es: 'Octavos',                 fr: 'Huitièmes de finale',     pt: 'Oitavos de final' },
  'round.QF':                        { en: 'Quarter-final',            es: 'Cuartos de final',        fr: 'Quarts de finale',        pt: 'Quartos de final' },
  'round.SF':                        { en: 'Semi-final',               es: 'Semifinal',               fr: 'Demi-finale',             pt: 'Meias-finais' },
  'round.Final':                     { en: 'Final',                    es: 'Final',                   fr: 'Finale',                  pt: 'Final' },
  'round.heading_r32':               { en: '{matchId} ({a} vs {b})',   es: '{matchId} ({a} vs {b})',  fr: '{matchId} ({a} vs {b})',  pt: '{matchId} ({a} vs {b})' },
  'round.heading_other':             { en: '{matchId} (winner {a} vs winner {b})', es: '{matchId} (ganador {a} vs ganador {b})', fr: '{matchId} (vainqueur {a} vs vainqueur {b})', pt: '{matchId} (vencedor {a} vs vencedor {b})' },

  // ── Round card body ────────────────────────────────────────────────────
  'round.your_match':                { en: 'Your match',               es: 'Tu partido',              fr: 'Votre match',             pt: 'O seu jogo' },
  'round.r32_tip':                   { en: 'Drag a specific team into the opponent slot to lock in a match-up. Otherwise the panel shows the most likely opponents based on group-stage simulation.', es: 'Arrastra un equipo al hueco del rival para fijar un cruce concreto. Si no, el panel muestra los rivales más probables según la simulación de la fase de grupos.', fr: 'Faites glisser une équipe dans la case adverse pour fixer un duel précis. Sinon, le panneau affiche les adversaires les plus probables selon la simulation de la phase de groupes.', pt: 'Arraste uma equipa para o lugar do adversário para fixar um confronto. Caso contrário, o painel mostra os adversários mais prováveis segundo a simulação da fase de grupos.' },
  'round.opponent_feeder':           { en: 'Opponent feeder — fill in flags & odds to compute who you might play', es: 'Camino del rival — completa banderas y odds para calcular contra quién jugarías', fr: 'Parcours adverse — remplissez drapeaux et cotes pour calculer qui vous affronteriez', pt: 'Caminho do adversário — preencha bandeiras e odds para calcular contra quem jogaria' },
  'round.might_play':                { en: 'MIGHT PLAY',               es: 'POSIBLES RIVALES',        fr: 'ADVERSAIRES POSSIBLES',   pt: 'POSSÍVEIS ADVERSÁRIOS' },
  'round.opponent_label':            { en: '{round} opponent',         es: 'Rival de {round}',        fr: 'Adversaire de {round}',   pt: 'Adversário de {round}' },
  'round.opponent_tbd':              { en: 'opponent — TBD',           es: 'rival — por definir',     fr: 'adversaire — à définir',  pt: 'adversário — por definir' },
  'round.with_this_level':           { en: 'With this {level}:',       es: 'Con este {level}:',       fr: 'Avec ces {level} :',      pt: 'Com este {level}:' },
  'round.other_teams':               { en: '+{n} other teams',         es: '+{n} otros equipos',      fr: '+{n} autres équipes',     pt: '+{n} outras equipas' },
  'round.other_team_singular':       { en: '+1 other team',            es: '+1 otro equipo',          fr: '+1 autre équipe',         pt: '+1 outra equipa' },
  'round.tbd_fill':                  { en: 'TBD — fill in opponent feeder', es: 'Por definir — completa el camino del rival', fr: 'À définir — complétez le parcours adverse', pt: 'Por definir — preencha o caminho do adversário' },
  'round.pct_face_caption':          { en: '% = chance to face you at this round', es: '% = probabilidad de enfrentarte en esta ronda', fr: '% = chance de vous affronter à ce tour', pt: '% = probabilidade de o enfrentar nesta ronda' },
  'round.lock_aria':                 { en: 'Your team — locked',       es: 'Tu equipo — fijado',      fr: 'Votre équipe — verrouillée', pt: 'A sua equipa — fixada' },
  'round.lock_title':                { en: 'Your analyzed team — locked across every round', es: 'Tu equipo analizado — fijado en todas las rondas', fr: 'Votre équipe analysée — verrouillée à chaque tour', pt: 'A sua equipa analisada — fixada em todas as rondas' },

  // ── Match box ──────────────────────────────────────────────────────────
  'match.top_wins':                  { en: '% Home Team wins:',        es: '% gana el local:',        fr: '% victoire à domicile :', pt: '% vitória da casa:' },
  'match.top_wins_title':            { en: '% chance the Home Team wins this match', es: '% de que gane el equipo local', fr: '% de victoire de l\'équipe à domicile', pt: '% de vitória da equipa da casa' },
  'match.auto_one':                  { en: 'auto→1°',                  es: 'auto→1°',                 fr: 'auto→1°',                 pt: 'auto→1°' },
  'match.auto_one_title':            { en: '1° vs 3° auto-resolves to 1° unless contradicted', es: '1° vs 3° se resuelve a 1° salvo que se indique lo contrario', fr: '1° vs 3° favorise le 1° par défaut sauf indication contraire', pt: '1° vs 3° resolve a favor do 1° salvo indicação em contrário' },
  'match.estimate_top_title':        { en: 'Most likely opponent based on group-stage simulation. Drag a specific team here to lock in a different match-up.', es: 'Rival más probable según la simulación de la fase de grupos. Arrastra otro equipo aquí para fijar un cruce distinto.', fr: 'Adversaire le plus probable selon la simulation de la phase de groupes. Faites glisser une autre équipe ici pour fixer un duel différent.', pt: 'Adversário mais provável segundo a simulação da fase de grupos. Arraste outra equipa para aqui para fixar um confronto diferente.' },
  'match.drop_hint':                 { en: '· you can drop a team here', es: '· puedes soltar un equipo aquí', fr: '· déposez une équipe ici', pt: '· pode largar uma equipa aqui' },
  'match.slot_drop_hint_title':      { en: 'Drag a team here to lock them in as your opponent at this round', es: 'Arrastra una equipa aquí para fijarla como rival en esta ronda', fr: 'Faites glisser une équipe ici pour la fixer comme adversaire à ce tour', pt: 'Arraste uma equipa para aqui para a fixar como adversário nesta ronda' },
  'match.percent_face_tooltip':      { en: '{team} has a {pct}% chance of being your {round} opponent. Other candidates and their probabilities are listed in the panel on the right. Drag a different team here to lock that match-up instead.', es: '{team} tiene un {pct}% de ser tu rival de {round}. Otros candidatos y sus probabilidades aparecen en el panel de la derecha. Arrastra otro equipo aquí para fijar ese cruce.', fr: '{team} a {pct}% de chances d\'être votre adversaire en {round}. Les autres candidats sont listés dans le panneau de droite. Faites glisser une autre équipe ici pour fixer ce duel.', pt: '{team} tem {pct}% de probabilidade de ser o seu adversário nas {round}. Outros candidatos e probabilidades estão no painel da direita. Arraste outra equipa para aqui para fixar esse confronto.' },
  'match.drag_to_next':              { en: 'Drag {team} to next round', es: 'Arrastra {team} a la siguiente ronda', fr: 'Faites glisser {team} au tour suivant', pt: 'Arraste {team} para a ronda seguinte' },
  'match.clear':                     { en: 'Clear slot',               es: 'Limpiar hueco',           fr: 'Vider la case',           pt: 'Limpar lugar' },
  'match.thirds_any':                { en: '(any)',                    es: '(cualquiera)',            fr: '(au choix)',              pt: '(qualquer)' },
  'match.empty_slot_title':          { en: '{label} — you can drag any eligible team here to lock in this matchup', es: '{label} — arrastra aquí cualquier equipo elegible para fijar este cruce', fr: '{label} — faites glisser ici toute équipe éligible pour fixer ce duel', pt: '{label} — arraste para aqui qualquer equipa elegível para fixar este confronto' },
  'match.estimated_odds_title':      { en: 'Estimated {pct}% from team strength — type to override', es: 'Estimado {pct}% por fuerza del equipo — escribe para sobrescribir', fr: 'Estimé à {pct}% selon la force des équipes — saisissez pour remplacer', pt: 'Estimado {pct}% pela força das equipas — escreva para substituir' },

  // ── Empty state / landing ─────────────────────────────────────────────
  'empty.tagline':                   { en: 'Visualize every team\'s path to Glory', es: 'Visualiza el camino de cada equipo hacia la Gloria', fr: 'Visualisez le parcours de chaque équipe vers la Gloire', pt: 'Visualize o caminho de cada equipa rumo à Glória' },
  'empty.quick_start':               { en: 'Quick start with a favourite', es: 'Comienzo rápido con un favorito', fr: 'Démarrage rapide avec un favori', pt: 'Início rápido com um favorito' },
  'empty.or_pick':                   { en: 'Or pick any of the 48 teams from the menu at the top', es: 'O elige cualquiera de los 48 equipos en el menú superior', fr: 'Ou choisissez une des 48 équipes depuis le menu en haut', pt: 'Ou escolha uma das 48 equipas no menu superior' },
  'empty.how_it_works':              { en: 'How it works',             es: 'Cómo funciona',           fr: 'Comment ça marche',       pt: 'Como funciona' },
  'empty.step1':                     { en: 'Pick a team and how they finish their group — 1°, 2° or 3°.', es: 'Elige un equipo y cómo termina su grupo — 1°, 2° o 3°.', fr: 'Choisissez une équipe et sa position dans son groupe — 1°, 2° ou 3°.', pt: 'Escolha uma equipa e a sua posição no grupo — 1°, 2° ou 3°.' },
  'empty.step2':                     { en: 'Drag opponents into the bracket and (optionally) set match odds — or let WCKO estimate them from team strength.', es: 'Arrastra rivales al cuadro y (opcionalmente) ajusta las odds — o deja que WCKO las estime según la fuerza de los equipos.', fr: 'Faites glisser les adversaires dans le tableau et (optionnellement) réglez les cotes — ou laissez WCKO les estimer selon la force des équipes.', pt: 'Arraste adversários para o quadro e (opcionalmente) defina as odds — ou deixe o WCKO estimá-las pela força das equipas.' },
  'empty.step3':                     { en: 'See who your team might face at every round, all the way to the Final.', es: 'Mira a quién podría enfrentarse tu equipo en cada ronda, hasta la Final.', fr: 'Voyez qui votre équipe pourrait affronter à chaque tour, jusqu\'à la Finale.', pt: 'Veja contra quem a sua equipa pode jogar em cada ronda, até à Final.' },
  'empty.preserved':                 { en: 'Save scenarios in your browser. Share a link with friends. Refresh as the tournament unfolds.', es: 'Guarda escenarios en tu navegador. Comparte un enlace con amigos. Actualiza a medida que avanza el torneo.', fr: 'Sauvegardez vos scénarios dans le navigateur. Partagez un lien avec vos amis. Mettez à jour au fur et à mesure du tournoi.', pt: 'Guarde cenários no seu navegador. Partilhe um link com amigos. Atualize à medida que o torneio avança.' },

  // ── Path survival panel ───────────────────────────────────────────────
  'survival.from_here':              { en: 'From here, {team} would', es: 'Desde aquí, {team}',     fr: 'À partir d\'ici, {team}', pt: 'A partir daqui, {team}' },
  'survival.reach':                  { en: 'Reach {round}',            es: 'Llegar a {round}',        fr: 'Atteindre les {round}',   pt: 'Chegar às {round}' },
  'survival.champion':               { en: 'Champion 🏆',              es: 'Campeón 🏆',              fr: 'Champion 🏆',             pt: 'Campeão 🏆' },

  // ── Group card ────────────────────────────────────────────────────────
  'group.label':                     { en: 'Group {letter}',           es: 'Grupo {letter}',          fr: 'Groupe {letter}',         pt: 'Grupo {letter}' },

  // ── Left rail (palette) ──────────────────────────────────────────────
  'rail.heading':                    { en: 'Teams',                    es: 'Equipos',                 fr: 'Équipes',                 pt: 'Equipas' },
  'rail.hint':                       { en: 'Drag a flag onto any highlighted slot.', es: 'Arrastra una bandera a cualquier hueco resaltado.', fr: 'Faites glisser un drapeau dans une case surlignée.', pt: 'Arraste uma bandeira para qualquer lugar destacado.' },

  // ── Slot labels ───────────────────────────────────────────────────────
  'slot.thirds_short':               { en: '3° {{groups}}',            es: '3° {{groups}}',           fr: '3° {{groups}}',           pt: '3° {{groups}}' },
  'slot.thirds_any':                 { en: 'Any 3° team from {groups} — drop a flag to specify', es: 'Cualquier 3° de {groups} — suelta una bandera para concretar', fr: 'Toute 3° parmi {groups} — déposez un drapeau pour préciser', pt: 'Qualquer 3° de {groups} — largue uma bandeira para concretizar' },

  // ── Footer ────────────────────────────────────────────────────────────
  'footer.tagline':                  { en: 'WCKO · scenarios saved to your browser', es: 'WCKO · escenarios guardados en tu navegador', fr: 'WCKO · scénarios enregistrés dans votre navigateur', pt: 'WCKO · cenários guardados no seu navegador' },
  'footer.feedback':                 { en: 'Feedback',                 es: 'Comentarios',             fr: 'Commentaires',            pt: 'Comentários' },
  'footer.feedback_title':           { en: 'Send feedback or report a bug', es: 'Envía comentarios o reporta un error', fr: 'Envoyez vos commentaires ou signalez un bug', pt: 'Envie comentários ou reporte um erro' },
  'footer.email_subject':            { en: 'WCKO feedback',            es: 'Comentarios WCKO',        fr: 'Commentaires WCKO',       pt: 'Comentários WCKO' },

  // ── Language switcher ────────────────────────────────────────────────
  'lang.label':                      { en: 'Language',                 es: 'Idioma',                  fr: 'Langue',                  pt: 'Idioma' },
} satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof STRINGS;
