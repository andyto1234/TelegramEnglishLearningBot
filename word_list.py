import sys
import textstat

# def difficulty_score(input):
difficult_words = textstat.difficult_words_list(sys.argv[1], syllable_threshold=4)
print(difficult_words)
sys.stdout.flush()
