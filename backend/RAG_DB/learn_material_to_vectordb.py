# General packages
import os
from typing import List

# PDF processing and FAISS integration
from PyPDF2 import PdfReader
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter

class PDFVectorStore:
    def __init__(self, embedding_model, embeddings_path: str = None):
        """
        Initializes the PDFVectorStore with the specified embedding model and embeddings path.

        Parameters:
        embedding_model: An instance of the embedding model.
        embeddings_path (str): Path to save or load the embeddings (vectorstore).
        """
        self.embedding_model = embedding_model
        self.embeddings_path = embeddings_path

        # Initialize or load vectorstore
        if embeddings_path and os.path.exists(embeddings_path):
            # Load existing vectorstore
            self.vectorstore = FAISS.load_local(
                embeddings_path, embeddings=self.embedding_model, allow_dangerous_deserialization=True
            )
        else:
            # Initialize empty vectorstore
            self.vectorstore = None  # Will be created when adding documents

    def _get_pdf_text(self, pdf_path: str) -> str:
        """
        Extracts text from a PDF document.

        Parameters:
        pdf_path (str): Path to the PDF document.

        Returns:
        str: Extracted text.
        """
        text = ""
        pdf_reader = PdfReader(pdf_path)
        for page in pdf_reader.pages:
            text += page.extract_text() if page.extract_text() else ""
        return text

    def _split_text(self, text: str) -> List[str]:
        """
        Splits the input text into chunks using RecursiveCharacterTextSplitter.

        Returns:
        List[str]: A list of text chunks.
        """
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500, chunk_overlap=100
        )
        chunks = text_splitter.split_text(text)
        return chunks

    def add_pdf_folder_to_vectorstore(self, folder_path: str):
        """
        Adds all PDFs in a folder to the vectorstore.

        Parameters:
        folder_path (str): Path to the folder containing PDF documents.
        """
        for filename in os.listdir(folder_path):
            if filename.endswith(".pdf"):
                pdf_path = os.path.join(folder_path, filename)
                self.add_document_to_vectorstore(pdf_path)

    def add_document_to_vectorstore(self, pdf_path: str):
        """
        Adds a PDF document to the vectorstore.

        Parameters:
        pdf_path (str): Path to the PDF document.
        """
        # Extract text from PDF
        text = self._get_pdf_text(pdf_path)
        # Split text into chunks
        chunks = self._split_text(text)
        # Embed chunks
        if self.vectorstore is None:
            # Create a new vectorstore
            self.vectorstore = FAISS.from_texts(
                texts=chunks, embedding=self.embedding_model
            )
        else:
            # Add new documents to existing vectorstore
            self.vectorstore.add_texts(chunks)
        # Save vectorstore
        if self.embeddings_path:
            self.vectorstore.save_local(self.embeddings_path)

# Example usage
if __name__ == "__main__":
    folder_path = "./General_Reference"  # "./Math"  # "./General_Science" # "./Arabic_Grammar"  # Replace with your folder path
    output_path = "./General_Reference-VS"  # "./Math-VS"  # "./General_Science-VS" # "./Arabic_Grammar-VS"
    embedding_model_id = "intfloat/multilingual-e5-large"

    # create vector db for the specific folder_path
    embedding_model = SentenceTransformerEmbeddings(model_name=embedding_model_id)
    vectorstore = PDFVectorStore(embedding_model, embeddings_path=output_path)
    vectorstore.add_pdf_folder_to_vectorstore(folder_path)
