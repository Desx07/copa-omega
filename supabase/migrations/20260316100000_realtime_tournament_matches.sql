-- Enable realtime for tournament_matches so brackets update live
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
