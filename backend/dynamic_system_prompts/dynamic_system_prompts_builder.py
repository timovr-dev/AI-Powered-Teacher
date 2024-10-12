import os


def load_file(file_path):
    """Helper function to read file content."""
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()


def build_system_prompt(topic_folder):
    """Build the system prompt by reading instructions, examples and definition for a given topic folder.
    return definition, instructions, examples and the created system prompt
    """
    tokenizer_prefix = "<s>[INST] "

    instructions_path = os.path.join(topic_folder, 'Instructions.txt')
    examples_path = os.path.join(topic_folder, 'Examples.txt')
    definition_path = os.path.join(topic_folder, 'Definition.txt')

    if not os.path.exists(instructions_path) or not os.path.exists(examples_path) or not os.path.exists(definition_path):
        raise FileNotFoundError(f"Missing 'Instructions.txt' or 'Examples.txt' or 'Definition.txt' in {topic_folder}")

    # Load instructions, examples and definition
    instructions = load_file(instructions_path)
    examples = load_file(examples_path)
    definition = load_file(definition_path)

    # Combine instructions and examples into a final system prompt
    system_prompt = f"{tokenizer_prefix}{instructions}\n{examples}"

    return definition, instructions, examples, system_prompt


def build_all_system_prompts(base_folder='../dynamic_system_prompts'):
    """Iterates over all topic folders to build system prompts."""
    topic_dict = {}

    # Iterate through each topic folder in the base folder
    for topic in os.listdir(base_folder):
        topic_folder = os.path.join(base_folder, topic)
        # avoid python outputs, non-topic folder
        if topic == "__pycache__":
            continue

        # Ensure the topic is a directory
        if os.path.isdir(topic_folder):
            try:
                # Build system prompt for the current topic
                definition, instructions, examples, system_prompt = build_system_prompt(topic_folder)
                topic_dict[topic] = [definition, instructions, examples, system_prompt]
            except FileNotFoundError as e:
                print(e)

    return topic_dict


if __name__ == "__main__":
    # Generate all system prompts from the 'System_Prompts' folder
    all_prompts_dict = build_all_system_prompts()

    # Example output
    for topic, definition_instructions_examples_prompt in all_prompts_dict.items():
        print(f"\n=== System Prompt for Topic: {topic} ===\n")
        print("Definition: {}".format(definition_instructions_examples_prompt[0]) + "\n")
        print("Prompt:\n{}".format(definition_instructions_examples_prompt[3]))
