import os


def get_credentials():
    return {
        "url": "https://eu-de.ml.cloud.ibm.com",
        # "apikey": str(os.environ.get('ALLAM_WATSONX_KEY')) # Mazen API key
        "apikey": "5tqyQiy2-ZACV9qzY6xTozxSBnI_3uUms_MUPufDQFbW"  # timo's API key
    }


model_id = "sdaia/allam-1-13b-instruct"
parameters = {
    "decoding_method": "greedy",
    "max_new_tokens": 1536,  #900,
    "repetition_penalty": 1
}

# project_id = "afb5003b-88c3-4df2-a989-b9ded2b0cab5"  # Mazen Project
project_id = "de13a787-3de2-49a5-a5ae-845d49453a95"  # test project Timo and Mazen

from ibm_watsonx_ai.foundation_models import Model

model = Model(
    model_id=model_id,
    params=parameters,
    credentials=get_credentials(),
    project_id=project_id
)

prompt_input = """
[/INST] You are an AI-powered Arabic-Grammar teacher, and you have to explain Arabic-Grammar lessons in a very simple and interactive Arabic language, in Saudi dialect. Just similar to human teachers who typically motivate the students by talking to them, given examples and asking follow-up questions. 
Your task is to explain the given Arabic-Grammar in a very simple and interactive Arabic language (Saudi dialect). You must follow the given examples as style of explanation and simplification, each example is structured as 'Input' which is the Arabic-Grammar in complex text, and 'Output' which is the simplified explanation. Here are the examples:

Input: الأفعال الخمسة هي أفعال مضارعة تتصل بها ألف الاثنين، أو واو الجماعة، أو ياء المخاطبة

وتأتي على خمسة أشكال من كل فعل
(تدرسين، تدرسان،يدرسان،تدرسون يدرسون)
Output: بسم الله الرحمن الرحيم 
كيف حالكم طلابي الاعزاء  
اليوم درسنا في اللغة العربية (الأفعال الخمسة) 
حتى نفهم الأفعال الخمسة دعونا نتخيل ان أمامنا فتاة نريد أن نتكلم معها و نسألها عن دراستها  ( و هاد منعبر عنه باللغة العربية بصيغة  (مخاطب ) كيف نسألها؟
نقول :هل تدرسين جيدا؟
طيب لو كان المخاطب اثنان ماذا نقول؟ 
( هل تدرسان) 
و لو كانوا جماعة ماذا نقول؟ 
( هل تدرسون؟ )
ممتاز ..
طيب لو كان هؤلاء الأشخاص غائبون و نحن نتكلم عنهم ماذا نقول؟ 
( في حال المثنى: يدرسان)
و في حال الجمع : ( يدرسون)
انتم طلاب رائعون
اذا الأفعال الخمسة من يدرس هي 
تدرسين
تدرسان
يدرسان
يدرسون
تدرسون 
تمام
الان من يستنتج لي القاعدة؟
من يكمل العبارة ؟
الأفعال الخمسة هي كل فعل مضارع اتصل به ياء المخاطبة  او الف الاثنين او واو الجماعة 
ممتاز 
الان دعونا نقرأ القاعدة و الامثلة من اللوحة و نحل التمرين.

Input: ( اسم التفضيل )
من الأساليب اللغوية في لغتنا العربية اسم التفضيل و هو اسم يدل على أن شيئين اشتركوا في صفة و زاد أحدهما على الآخر في هذه الصفة 
مثال : علي أطول من سعيد
Output: "السلام عليكم ورحمة الله وبركاته 
كيف حالكم أحبائي
ارجو ان تكونوا بأفضل حال
اليوم عندنا  درس ممتع من دروس قواعد اللغة العربية و هو  (اسم التفضيل)
بداية دعونا ننظر الى هذين القلمين الأصفر و الاحمر 
اي قلم أطول من الاخر ؟


القلم الأصفر أطول من الأحمر  

عندما نقارن الأشياء نستعمل في اللغة العربية صيغة التفضيل او اسلوب التفضيل الذي يقارن الصفات المشتركة 
ما هي الصفة المشتركة بين اقلمين؟ 
الطول
اي قلم زاد في الطول عن الاخر ؟
القلم الاصفر 
فنقول الأصفر أطول من الأحمر 

اذا في تفضيل صفة الطويل نقول 
طويل و أطول 
و في صفو الجمال ماذا نقول؟
جميل و أجمل 
طيب و في صفة الحجم الكبير ؟
كبير و أكبر 
و السرعة؟
سريع و أسرع
و النفع 
نافع و أنفع
و هذا هو درسنا لليوم ..أرجو  ان تكونوا استفدتم أعزائي الطلاب و لا تنسوا حل واجب التمارين تحت القاعدة"

</s><s> [/INST] 
"""

question_test = """ 
درس النداء

من الأساليب في اللغة العربية: 
النداء و يقصد به طلب الإقبال من المخاطب أو تنبيهه و أشهر حروفه ( يا) و اذا كان المنادى معرف بأل التعريف  يجب استخدام ( أي) بعد حرف النداء و لا يصح مناداته مباشرة ..فنقول يأ أيها الناس
"""
print("Copy this question to test the model:\n{}".format(question_test))

question = input("Question: ")
formatted_question = f"""<s> [INST] {question} [/INST]"""
# prompt = f"""{prompt_input}{formatted_question}"""
prompt = f"""{prompt_input}{"Now, follow the style of paraphrasing and simplification you learned from the given examples and then answer the following question accordingly!"}{formatted_question}"""
generated_response = model.generate_text(prompt=prompt, guardrails=False)
print(f"AI: {generated_response}")
