# General packages
import os
from typing import List, Tuple

# RAG packages
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.schema import Document
from langchain.embeddings import SentenceTransformerEmbeddings

class RAGSystem:
    def __init__(self, embedding_model):
        """
        Initializes the RAGSystem with the specified embedding model.

        Parameters:
        model_name (str): The name of the embedding model to use.
        """
        #self.embedding_model = SentenceTransformerEmbeddings(model_name=model_name)
        self.embedding_model = embedding_model

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
            page_text = page.extract_text()
            if page_text:
                text += page_text
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

    def create_faiss_from_pdf(self, pdf_path: str, output_folder_path: str):
        """
        Creates a FAISS vector database from a single PDF file and saves it to the specified output folder.

        Parameters:
        pdf_path (str): Path to the single PDF file.
        output_folder_path (str): Path to the output folder where the FAISS vector database will be saved.
        """
        # Extract text from the PDF
        text = self._get_pdf_text(pdf_path)
        if not text:
            raise ValueError(f"No text could be extracted from the PDF: {pdf_path}")

        # Split the text into chunks
        chunks = self._split_text(text)
        if not chunks:
            raise ValueError(f"No text chunks were created from the PDF: {pdf_path}")

        # Create a new FAISS vectorstore from the chunks
        faiss_db = FAISS.from_texts(texts=chunks, embedding=self.embedding_model)

        # Ensure the output directory exists
        os.makedirs(output_folder_path, exist_ok=True)

        # Save the FAISS vectorstore to the output folder
        faiss_db.save_local(output_folder_path)

        print(f"FAISS vector database created and saved to: {output_folder_path}")

    def create_faiss_from_text(self, text: str, output_folder_path: str):
        """
        Creates a FAISS vector database from a text string and saves it to the specified output folder.

        Parameters:
        text (str): Text of the data that should be stored in the vector database.
        output_folder_path (str): Path to the output folder where the FAISS vector database will be saved.
        """

        # Split the text into chunks
        chunks = self._split_text(text)

        # Create a new FAISS vectorstore from the chunks
        faiss_db = FAISS.from_texts(texts=chunks, embedding=self.embedding_model)

        # Ensure the output directory exists
        os.makedirs(output_folder_path, exist_ok=True)

        # Save the FAISS vectorstore to the output folder
        faiss_db.save_local(output_folder_path)

        print(f"FAISS vector database created and saved to: {output_folder_path}")


    def retrieve_top_chunks_from_two_vectorstores(
        self, path1: str, path2: str, user_question: str, num_chunks: int = 3
    ) -> List[str]:
        """
        Retrieves the top N most similar chunks from two FAISS vectorstores based on the user's question.

        Parameters:
        path1 (str): Path to the first FAISS vectorstore.
        path2 (str): Path to the second FAISS vectorstore.
        user_question (str): The user's question.
        num_chunks (int): Number of top chunks to return (default is 3).

        Returns:
        List[str]: List of the top N most similar chunks from both vectorstores.
        """
        # Load the first vectorstore
        if not os.path.exists(path1):
            raise ValueError(f"Vectorstore path1 does not exist: {path1}")
        vectorstore_a = FAISS.load_local(
            path1, embeddings=self.embedding_model, allow_dangerous_deserialization=True
        )

        # Load the second vectorstore
        if not os.path.exists(path2):
            raise ValueError(f"Vectorstore path2 does not exist: {path2}")
        vectorstore_b = FAISS.load_local(
            path2, embeddings=self.embedding_model, allow_dangerous_deserialization=True
        )

        # Perform similarity search on both vectorstores with scores
        docs_a = vectorstore_a.similarity_search_with_score(
            user_question, k=num_chunks
        )
        docs_b = vectorstore_b.similarity_search_with_score(
            user_question, k=num_chunks
        )

        # Combine the results
        combined_docs = docs_a + docs_b  # List[Tuple[Document, float]]

        # Sort the combined documents by their similarity scores in descending order (No, ascending, the lower better)
        combined_docs_sorted = sorted(combined_docs, key=lambda x: x[1], reverse=False)  # reverse=True)

        # Extract the top N chunks based on the sorted scores
        top_chunks = [doc.page_content for doc, score in combined_docs_sorted[:num_chunks]]

        return top_chunks

    def retrieve_top_chunks_from_vectorstore(
        self, path: str, user_question: str, num_chunks: int = 3
    ) -> List[str]:
        """
        Retrieves the top N most similar chunks from a FAISS vectorstore based on the user's question.

        Parameters:
        path (str): Path to the FAISS vectorstore.
        user_question (str): The user's question.
        num_chunks (int): Number of top chunks to return (default is 3).

        Returns:
        List[str]: List of the top N most similar chunks from the vectorstore.
        """
        # Load the vectorstore
        if not os.path.exists(path):
            raise ValueError(f"Vectorstore path does not exist: {path}")
        vectorstore = FAISS.load_local(
            path, embeddings=self.embedding_model, allow_dangerous_deserialization=True
        )

        # Perform similarity search with scores
        docs = vectorstore.similarity_search_with_score(
            user_question, k=num_chunks
        )

        # Sort the documents by their similarity scores in descending order
        docs_sorted = sorted(docs, key=lambda x: x[1], reverse=True)

        # Extract the top N chunks based on the sorted scores
        top_chunks = [doc.page_content for doc, score in docs_sorted[:num_chunks]]

        return top_chunks
