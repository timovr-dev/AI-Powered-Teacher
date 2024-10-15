import re
import random
import os
import sys

# Add the directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dynamic_system_prompts_builder import build_all_system_prompts


def extract_inputs_between_input_output(example_text):
    # Use regular expression to capture text between "Input" and "Output"
    pattern1 = r"Input.*?(?=User Interest)"
    pattern2 = r"Input.*?(?=Output)"
    matches = re.findall(pattern1, example_text, re.DOTALL)
    if len(matches) == 0:
        matches = re.findall(pattern2, example_text, re.DOTALL)
    return [match.strip() for match in matches]


# Function to build the classifier system prompt, taking 2 random examples from the list of examples
def build_classifier_system_prompt(all_prompts_dict):
    # Start with the fixed instruction portion
    classifier_system_prompt = """
    <s>[INST] You are an AI-powered text classifier, your task is to classify the given text into only ONE of the following topics: 
    """

    # Add the topic names as classified labels first
    topic_labels = ", ".join(all_prompts_dict.keys())
    classifier_system_prompt += f"{topic_labels}.\n\n"

    # Add short definitions from the dictionary
    for topic_name, content_list in all_prompts_dict.items():
        short_definition = content_list[0]
        classifier_system_prompt += f"For {topic_name}: {short_definition}\n"

    classifier_system_prompt += "\nHere are examples covering all the topics:\n"

    # Randomly select 2 examples per topic
    example_count = 1
    for topic, definition_instructions_examples_prompt in all_prompts_dict.items():
        examples = extract_inputs_between_input_output(definition_instructions_examples_prompt[2])
        # Select 1 example
        selected_example = random.choice(examples)

        # Add the input portion, and then classify to the corresponding topic
        classifier_system_prompt += f"<<Example{example_count}>>:\n{selected_example.strip()}\nOutput: {topic}\n\n"
        example_count += 1

    # Add the final, emphasized instruction
    classifier_system_prompt += f"""***IMPORTANT INSTRUCTION:***
        - You must classify the whole text into exactly ONE topic from the following list: ({topic_labels}). 
        - DO NOT classify sections or individual sentences; provide only ONE topic for the ENTIRE text.
        - Your output MUST be only one topic from the list. Do not output any other information, clarifications, or explanations.
        - DO NOT write more than one topic, regardless of multiple sections in the text.
        - Output format: Only ONE topic from the list, e.g., "{topic_labels.split(', ')[0]}".
    """

    # Add instruction for "General_Paraphrasing"
    classifier_system_prompt += "\n\nIf the content does not match any of the above topics, classify it as 'General_Paraphrasing'."

    return classifier_system_prompt


def get_dynamic_classifier_prompt(base_folder='../dynamic_system_prompts'):
    all_system_prompts_dict = build_all_system_prompts(base_folder=base_folder)
    dynamic_classifier_prompt = build_classifier_system_prompt(all_system_prompts_dict)

    return dynamic_classifier_prompt


if __name__ == "__main__":
    # Build the classifier system prompt using randomly selected examples
    dynamic_classifier_prompt = get_dynamic_classifier_prompt()
    print(dynamic_classifier_prompt)
