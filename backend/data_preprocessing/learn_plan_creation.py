

import json
from openai import OpenAI
from PyPDF2 import PdfReader
from pprint import pprint
import os

def load_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def create_learning_plan(content):
    api_key = "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"
    client = OpenAI(api_key=api_key)
    
    system_prompt = """
    You are an expert curriculum designer. Your task is to create a structured learning plan 
    from the given content. The plan should be divided into logical sections, each containing 
    200-300 words. Maintain the original structure and order of the content, ensuring that 
    each chunk makes sense to learn in the given sequence.
    """
    
    user_prompt = f"""
    Please create a structured learning plan from the following content. Divide the plan into 
    sections of 200-300 words each, maintaining the original structure and order:

    {content}
    """

    pprint(user_prompt)
    
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    
    return completion.choices[0].message.content

def save_to_json(learning_plan, output_file):
    chunks = learning_plan.split('\n\n')
    json_data = [{"chunk": i+1, "content": chunk} for i, chunk in enumerate(chunks)]
    
    with open(output_file, 'w') as f:
        json.dump(json_data, f, indent=2)

def main():
    pdf_path = "./Saudi-Arabia.pdf"
    output_file = "./Saudi-Arabia.json"
    
    if not os.path.exists(pdf_path):
        print("Error: The specified PDF file does not exist.")
        return
    
    pdf_content = load_pdf(pdf_path)
    learning_plan = create_learning_plan(pdf_content)
    save_to_json(learning_plan, output_file)
    
    print(f"Learning plan has been created and saved to {output_file}")

if __name__ == "__main__":
    main()