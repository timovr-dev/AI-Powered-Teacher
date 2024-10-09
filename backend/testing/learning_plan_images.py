import fitz
from openai import OpenAI
import os

def extract_pdf_with_images(pdf_path, images_folder="extracted_images"):
    """
    Extracts text and images from a PDF, inserting image tags where images were located.

    Parameters:
        pdf_path (str): The file path to the PDF.
        images_folder (str): The folder where extracted images will be saved.

    Returns:
        tuple: A tuple containing:
            - str: The extracted text with image placeholders.
            - dict: A dictionary mapping image tags to their file paths.
    """
    # Ensure the images folder exists
    if not os.path.exists(images_folder):
        os.makedirs(images_folder)

    # Open the PDF document
    doc = fitz.open(pdf_path)
    extracted_text = ""

    image_counter = 1  # To name images uniquely
    image_tag_counter = 1  # For image tags
    image_tags = {}  # Dictionary to store image tag to image path mapping

    for page_number in range(len(doc)):
        page = doc[page_number]
        extracted_text += f"\n\n--- Page {page_number + 1} ---\n\n"

        # Get all blocks on the page
        blocks = page.get_text("dict")["blocks"]

        # Sort blocks by their vertical position (top to bottom) and horizontal position (left to right)
        sorted_blocks = sorted(blocks, key=lambda b: (b['bbox'][1], b['bbox'][0]))

        for block in sorted_blocks:
            if block['type'] == 0:  # Text block
                for line in block.get("lines", []):
                    line_text = " ".join([span['text'] for span in line.get("spans", [])])
                    extracted_text += line_text + "\n"
            elif block['type'] == 1:  # Image block
                image_info = block.get("image")
                if image_info:
                    try:
                        if isinstance(image_info, int):
                            # image_info is an xref
                            pix = fitz.Pixmap(doc, image_info)
                        elif isinstance(image_info, bytes):
                            # image_info is raw image bytes
                            pix = fitz.Pixmap(image_info)
                        else:
                            print(f"Unknown image_info type: {type(image_info)}")
                            continue

                        if pix.n < 5:  # this is GRAY or RGB
                            image_format = "png"
                            image_filename = f"image_{page_number + 1}_{image_counter}.{image_format}"
                            image_path = os.path.join(images_folder, image_filename)
                            pix.save(image_path)
                        else:  # CMYK: convert to RGB first
                            pix = fitz.Pixmap(fitz.csRGB, pix)
                            image_format = "png"
                            image_filename = f"image_{page_number + 1}_{image_counter}.{image_format}"
                            image_path = os.path.join(images_folder, image_filename)
                            pix.save(image_path)
                        # Generate image tag
                        image_tag = f"IMAGE_TAG{image_tag_counter}"
                        extracted_text += f"[{image_tag}]\n"
                        # Map image tag to image path
                        image_tags[image_tag] = image_path
                        image_counter += 1
                        image_tag_counter += 1
                        pix = None  # Free Pixmap resources
                    except Exception as e:
                        print(f"Error processing image on page {page_number + 1}: {e}")
                        continue

    doc.close()
    return extracted_text, image_tags


def create_learning_plan(cilent, content):
    try:
        system_prompt = """
        You are an expert curriculum designer. Your task is to create a structured learning plan 
        from the given content. When you are writing the content use markdown format to highlighted important words. You can use (bold, italic, tables, blockquotes or lists). The plan should be divided into logical sections, each containing 
        200-300 words. Maintain the original structure and order of the content, ensuring that 
        each chunk makes sense to learn in the given sequence.

        Always follow this structure in your output: Title in bold, and few lines under it. 
        If you decide to add any text from your own, show it in a different format, under corresponding titles to let user know its yours, not the original.

        Use in the learning plan the following mark down components:
        - bold text
        - small headings
        - tables
        - quotes (>)
        
        At least, you have to bold the main terms in the text you show.

        """
        #Always write in Arabic, never write in English.

        user_prompt = f"""
        Please create a structured learning plan from the following content. Divide the plan into 
        sections of 200-300 words each, maintaining the original content and structure. Generate a JSON structure with the keys 'content_1', 'content_2', ..., 'content_n'. The values should be the sections.

        This is the content:
        {content}
        """

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
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

def main():
    # Ensure OpenAI API key is set
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    client = OpenAI(api_key=openai_api_key)
    pdf_file = "./alexnet.pdf"  # Replace with your PDF file path
    content, images = extract_pdf_with_images(pdf_file)

    print(content)
    #create_learning_plan(client, content)


main()