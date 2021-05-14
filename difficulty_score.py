import sys
import textstat

# def difficulty_score(input):
score = textstat.dale_chall_readability_score(sys.argv[1])
print(score)
sys.stdout.flush()
