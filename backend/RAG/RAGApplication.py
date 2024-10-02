# General packages
import os
from typing import List

# RAG packages
from PyPDF2 import PdfReader
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter

class RAGSystem:
    def __init__(self, embedding_model_name: str, embeddings_path: str = './rag_vectorstore', device: str = 'cpu'):
        """
        Initializes the RAGSystem with the specified embedding model and embeddings path.

        Parameters:
        embedding_model_name (str): The name of the embedding model from HuggingFace.
        embeddings_path (str): Path to save or load the embeddings (vectorstore).
        device (str): The device to run the embedding model on ('cpu' or 'cuda').
        """
        self.device = device
        self.embedding_model_name = embedding_model_name
        self.embedding_model = SentenceTransformerEmbeddings(
            model_name=embedding_model_name
        )
        self.embeddings_path = embeddings_path

        # Initialize or load vectorstore
        if os.path.exists(embeddings_path):
            # Load existing vectorstore
            self.vectorstore = FAISS.load_local(
                embeddings_path, embeddings=self.embedding_model
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
        self.vectorstore.save_local(self.embeddings_path)

    def add_data_to_vectorstore(self, plain_text: str):
        """
        Adds plain text data to the vectorstore.

        Parameters:
        plain_text (str): The text data to add.
        """
        # Split text into chunks
        chunks = self._split_text(plain_text)
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
        self.vectorstore.save_local(self.embeddings_path)

    def retrieve_most_similar_chunks(
        self, user_question: str, num_chunks: int = 3
    ) -> List[str]:
        """
        Retrieves the most similar chunks to the user's question.

        Parameters:
        user_question (str): The user's question.
        num_chunks (int): Number of chunks to retrieve.

        Returns:
        List[str]: List of the most similar chunks.
        """
        if self.vectorstore is None:
            raise ValueError(
                "Vectorstore is empty. Add documents to the vectorstore first."
            )
        docs = self.vectorstore.search(
            user_question, search_type='similarity', k=num_chunks
        )
        chunks = [doc.page_content for doc in docs]
        return chunks

    def generate_response(self, chunks: List[str], user_question: str) -> str:
        """
        Generates a response based on the chunks and user question.

        Parameters:
        chunks (List[str]): List of text chunks.
        user_question (str): The user's question.

        Returns:
        str: The generated response.
        """

        prompt = "nothing here the response will happen in the main script cause of streaming."
        return "[This is where the generated answer would be based on the context and question.]"