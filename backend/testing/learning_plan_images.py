from openai import OpenAI
import os

from marker.convert import convert_single_pdf
from marker.models import load_all_models

def create_learning_plan(client, content):
    try:
        system_prompt = """
        You are an expert curriculum designer. Your task is to create a structured learning plan 
        from the given content. When you are writing the content use markdown format to highlighted important words. You can use (bold, italic, tables, blockquotes or lists). The plan should be divided into logical sections, each containing 
        200-300 words. Maintain the original structure and order of the content, ensuring that 
        each chunk makes sense to learn in the given sequence.
        The first chunk must be always your own short introduction about the content, 
        and the last chunk must be always your own short summary about the content. 
        Important: Always split between the chunks using the following separator: "\n\n---\n\n", because I'll use this to get the chunks. 

        Always follow this structure in your output: Title in bold, and few lines under it. 
        If you decide to add any text from your own, show it in a different format, under corresponding titles to let user know its yours, not the original.

        Use in the learning plan the following mark down components:
        - bold text
        - small headings
        - tables
        - quotes (>)
        
        At least, you have to bold the main terms in the text you show.
        If images are in the markdown file you will see it with for instance "![0_image_0.png](0_image_0.png)" integrated it as well. Use all images in the learning plan that are also in the content.
        Always write in Arabic, never write in English.
        """
        #Always write in Arabic, never write in English.

        # user_prompt = f"""
        # Please create a structured learning plan from the following content. Divide the plan into
        # sections of 200-300 words each, maintaining the original content and structure. Generate a JSON structure with the keys 'content_1', 'content_2', ..., 'content_n'. The values should be the sections.
        #
        # This is the content:
        # {content}
        # """
        user_prompt = f"""
                Please create a structured learning plan from the following content. Divide the plan into 
                sections of 200-300 words each, maintaining the original content and structure.
                Important: Always split between the chunks using the following separator: "\n\n---\n\n", because I'll use this to get the chunks.
                You have to create at least one table in the learning plan.

                This is the content:
                {content}
                """

        completion = client.chat.completions.create(
            model="gpt-4o",
            temperature=0.1,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )

        learning_plan = completion.choices[0].message.content

        # Remove JSON markdown if present
        if learning_plan.startswith('```json') and learning_plan.endswith('```'):
            learning_plan = learning_plan[7:-3]  # Remove ```json from start and ```

        return learning_plan

    except Exception as e:
        print(f"Error creating learning plan: {e}")
        raise

def save_markdown(content, filename):
    """
    Save text content as a markdown file.

    Args:
        content (str): The text content to save
        filename (str): The name of the file (with or without .md extension)
    """
    # Add .md extension if not present
    if not filename.endswith('.md'):
        filename += '.md'

    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully saved to {filename}")
    except Exception as e:
        print(f"Error saving file: {e}")

def main():
    # Ensure OpenAI API key is set
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    client = OpenAI(api_key=openai_api_key)


    # extract pdf content

    pdf_file = "./alexnet.pdf"  # Replace with your PDF file path
    model_lst = load_all_models()

    full_text, images, out_meta = convert_single_pdf(pdf_file, model_lst)


    print(full_text)
    print("-"*20)
    print(images)
    # generate learning plan with image tags
    markdown_file = "./extracted_content.md"
    save_markdown(full_text, markdown_file)
    print("_"*50)
    learning_plan = create_learning_plan(client, full_text)
    print(learning_plan)

    markdown_file = "./generated_learning_plan.md"
    save_markdown(learning_plan, markdown_file)



main()